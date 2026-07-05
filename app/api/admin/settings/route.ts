import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/requireRole";

export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;
  void user;

  const value = (await req.json()) as Record<string, unknown>;
  const { error: err } = await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "config", value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
