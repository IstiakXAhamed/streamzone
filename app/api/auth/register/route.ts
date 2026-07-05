import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Create a Supabase Auth user and a pending local `users` row.
 * Supabase Auth auto-confirm (with email confirm off) lets the user sign in
 * immediately, but our NextAuth `signIn` callback blocks pending accounts so they
 * see the "awaiting approval" screen instead of the dashboard.
 */
export async function POST(req: Request) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  // create the auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm so they can hit the pending screen
  });

  const msg = error?.message?.toLowerCase() ?? "";
  const alreadyExists = msg.includes("already") || msg.includes("exists") || msg.includes("registered");
  if (error && !alreadyExists) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  void data;

  // upsert the pending mapping row
  await supabaseAdmin
    .from("users")
    .upsert(
      { email, role: "user", status: "pending", last_seen: new Date().toISOString() },
      { onConflict: "email" },
    );

  return NextResponse.json({ ok: true });
}
