import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Role, UserStatus } from "@/types/db";

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const emailOf = (e: string | null | undefined) => (e ?? "").toLowerCase().trim();

/**
 * Find or create the local `users` row that mirrors the Auth user.
 * Every self-registered user starts as `pending` (moderation gate).
 * The superadmin email is *always* seeded as `approved` + `superadmin`.
 */
async function resolveUserRole(email: string): Promise<{ role: Role; status: UserStatus }> {
  const normalized = emailOf(email);
  if (SUPERADMIN_EMAIL && normalized === emailOf(SUPERADMIN_EMAIL)) {
    return { role: "superadmin", status: "approved" };
  }
  const { data } = await supabaseAdmin
    .from("users")
    .select("role,status")
    .eq("email", normalized)
    .maybeSingle();
  if (!data) return { role: "user", status: "pending" };
  return { role: data.role as Role, status: data.status as UserStatus };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // NOTE: Supabase Auth owns password verification. The credentials flow is
      // a stub until Supabase auth verifies the user server-side. The Google flow
      // goes through Supabase signInWithOAuth directly from the client.
      async authorize() {
        return null; // credentials login handled by /api/auth/signin route
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = emailOf(user.email);
      if (!email) return false;

      const { role, status } = await resolveUserRole(email);

      // upsert the mapping row so admins can see every registered account
      await supabaseAdmin
        .from("users")
        .upsert(
          {
            email,
            name: user.name ?? null,
            avatar_url: user.image ?? null,
            role,
            status,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "email" },
        );

      // pending / suspended users are blocked from signing in
      return status !== "pending" && status !== "suspended";
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const { role, status } = await resolveUserRole(user.email);
        token.role = role;
        token.status = status;
        const { data } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", emailOf(user.email))
          .maybeSingle();
        token.uid = data?.id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as Role) ?? "user";
        session.user.status = (token.status as UserStatus) ?? "pending";
        session.user.id = (token.uid as string) ?? "";
      }
      return session;
    },
  },
};
