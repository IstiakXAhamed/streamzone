import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Role, UserStatus } from "@/types/db";

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const emailOf = (e: string | null | undefined) => (e ?? "").toLowerCase().trim();

/**
 * Validate email+password against Supabase Auth WITHOUT mutating the password.
 * We spin up a short-lived anon client (never exposed to the browser) whose
 * only job is to attempt a server-side signInWithPassword. A successful
 * attempt proves the credentials are correct.
 */
async function verifyCredentials(email: string, password: string): Promise<string | null> {
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Find or create the local `users` row that mirrors the Auth user.
 * Every self-registered user starts as `pending` (moderation gate).
 * The superadmin email is *always* seeded as `approved` + `superadmin`.
 */
async function resolveUserRole(email: string): Promise<{ role: Role; status: UserStatus }> {
  const normalized = emailOf(email);

  // Always check the DB row first — it's the source of truth.
  const { data } = await supabaseAdmin
    .from("users")
    .select("role,status")
    .ilike("email", normalized)
    .maybeSingle();

  if (data) {
    return { role: data.role as Role, status: data.status as UserStatus };
  }

  // No DB row yet — bootstrap from env if this is the configured superadmin.
  if (SUPERADMIN_EMAIL && normalized === emailOf(SUPERADMIN_EMAIL)) {
    return { role: "superadmin", status: "approved" };
  }

  // Brand-new user → pending until an admin approves.
  return { role: "user", status: "pending" };
}

const useSecureCookies = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: useSecureCookies ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: useSecureCookies ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          // Basic profile only. Uploads use a dedicated storage-account refresh
          // token (GOOGLE_DRIVE_REFRESH_TOKEN), not the admin's own Drive.
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;
        const authUserId = await verifyCredentials(email, password);
        if (!authUserId) return null;
        return { id: authUserId, email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = emailOf(user.email);
      if (!email) return false;

      const { role, status } = await resolveUserRole(email);

      await supabaseAdmin
        .from("users")
        .upsert(
          {
            email: email.toLowerCase(),
            name: user.name ?? null,
            avatar_url: user.image ?? null,
            role,
            status,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "email" },
        );

      return status !== "pending" && status !== "suspended";
    },
    async jwt({ token, user, account }) {
      // Persist Google OAuth tokens on initial sign-in
      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleTokenExpires = account.expires_at ? account.expires_at * 1000 : 0;
      }
      if (user?.email) {
        const { role, status } = await resolveUserRole(user.email);
        token.role = role;
        token.status = status;
        const { data } = await supabaseAdmin
          .from("users")
          .select("id")
          .ilike("email", emailOf(user.email))
          .maybeSingle();
        token.uid = data?.id ?? null;
      }
      // Refresh Google access token if expired
      if (token.googleRefreshToken && token.googleTokenExpires && Date.now() > (token.googleTokenExpires as number)) {
        try {
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID ?? "",
              client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
              grant_type: "refresh_token",
              refresh_token: token.googleRefreshToken as string,
            }),
          });
          const data = await res.json() as { access_token?: string; expires_in?: number };
          if (data.access_token) {
            token.googleAccessToken = data.access_token;
            token.googleTokenExpires = Date.now() + (data.expires_in ?? 3600) * 1000;
          }
        } catch {
          // If refresh fails, clear the tokens — user will need to re-auth
          token.googleAccessToken = undefined;
          token.googleTokenExpires = 0;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as Role) ?? "user";
        session.user.status = (token.status as UserStatus) ?? "pending";
        session.user.id = (token.uid as string) ?? "";
      }
      // Expose Google access token for Drive uploads (server-side only via getServerSession)
      (session as any).googleAccessToken = token.googleAccessToken ?? null;
      return session;
    },
  },
};
