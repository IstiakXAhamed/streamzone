import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Phase-0 smoke test: hit Supabase + a Drive env check and report statuses.
 * Replace `/api/smoke` callout docs with the live statuses.
 * Safe to delete after Phase 0 verification — never relied on by app code.
 */
export async function GET() {
  const now = new Date().toISOString();
  const supabase = await (async () => {
    try {
      const { count, error } = await supabaseAdmin
        .from("users")
        .select("id", { count: "exact", head: true });
      return error
        ? { ok: false, error: error.message, count: null }
        : { ok: true, count };
    } catch (e) {
      return { ok: false, error: (e as Error).message, count: null }
    }
  })();

  const drive = {
    serviceAccount: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64),
    driveApiKey: Boolean(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY),
    folderId: Boolean(process.env.NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID),
  };

  return NextResponse.json({
    ok: supabase.ok && drive.serviceAccount && drive.driveApiKey && drive.folderId,
    supabase,
    drive,
    time: now,
  });
}
