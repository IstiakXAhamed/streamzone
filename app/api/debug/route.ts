import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

  let dbRow = null;
  let lookupError = null;

  if (session?.user?.email) {
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id,email,role,status")
        .ilike("email", session.user.email)
        .maybeSingle();
      dbRow = data;
      lookupError = error?.message ?? null;
    } catch (e) {
      lookupError = (e as Error).message;
    }
  }

  const callbackUrl = `${(process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")}/api/auth/callback/google`;

  return NextResponse.json({
    hasSession: !!session,
    sessionEmail: session?.user?.email ?? null,
    sessionRole: (session?.user as any)?.role ?? null,
    sessionStatus: (session?.user as any)?.status ?? null,
    dbRow,
    lookupError,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "(not set)",
    expectedCallbackUrl: callbackUrl,
  });
}
