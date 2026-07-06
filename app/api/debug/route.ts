import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Decode the JWT payload to see if this is really the service_role key
  let keyRole = "unknown";
  let keyIss = "unknown";
  if (svcKey) {
    try {
      const payload = JSON.parse(Buffer.from(svcKey.split(".")[1], "base64").toString("utf8"));
      keyRole = payload.role ?? "unknown";
      keyIss = payload.iss ?? "unknown";
    } catch { /* ignore */ }
  }

  // Try a direct service-role query and capture the exact error + status
  let dbRow = null;
  let lookupError: string | null = null;
  let lookupStatus: number | null = null;

  if (session?.user?.email && url && svcKey) {
    const admin = createClient(url, svcKey, { auth: { persistSession: false } });
    const { data, error, status } = await admin
      .from("users")
      .select("id,email,role,status")
      .ilike("email", session.user.email)
      .maybeSingle();
    dbRow = data;
    lookupError = error?.message ?? null;
    lookupStatus = status;
  }

  return NextResponse.json({
    hasSession: !!session,
    sessionEmail: session?.user?.email ?? null,
    dbRow,
    lookupError,
    lookupStatus,
    jwtRole: keyRole,            // "service_role" = correct, "anon" = wrong key in env
    jwtIss: keyIss,              // should start with "supabase"
    supabaseUrl: url ?? "(not set)",
    serviceRoleKeyIsSet: !!svcKey,
  });
}
