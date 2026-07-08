import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 300; // allow up to 5 min per chunk on Vercel Pro

/**
 * PUT /api/drive/upload-chunk?sid=<sessionId>&start=<n>&end=<n>&total=<n>
 *
 * Forwards a chunk of file bytes to Google Drive's resumable upload URL.
 * The session (Google upload URL + token) is looked up from Supabase by the
 * short `sid`, so requests stay small and don't trip Vercel's firewall.
 *
 * Body: raw chunk bytes.
 */
export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const sid = req.nextUrl.searchParams.get("sid");
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");
  const total = req.nextUrl.searchParams.get("total");

  if (!sid || !start || !end || !total) {
    return NextResponse.json({ error: "Missing query params: sid, start, end, total" }, { status: 400 });
  }

  // Look up the resumable session
  const { data: sessionRow, error: lookupErr } = await supabaseAdmin
    .from("upload_sessions")
    .select("upload_url, access_token")
    .eq("id", sid)
    .maybeSingle();

  if (lookupErr || !sessionRow) {
    return NextResponse.json({ error: "Upload session not found or expired" }, { status: 404 });
  }

  const chunkBody = await req.arrayBuffer();
  const contentRange = `bytes ${start}-${end}/${total}`;

  // NOTE: Do NOT send an Authorization header here. The resumable session URL
  // (with its embedded upload_id) is self-authenticating. Sending a Bearer
  // token that may have expired mid-upload causes Google to reject the chunk
  // with 403 — which is why uploads previously died on a late chunk.
  const googleRes = await fetch(sessionRow.upload_url, {
    method: "PUT",
    headers: {
      "content-length": String(chunkBody.byteLength),
      "content-range": contentRange,
    },
    body: chunkBody,
  });

  // 308 = Resume Incomplete (more chunks expected)
  if (googleRes.status === 308) {
    return NextResponse.json({ done: false }, { status: 200 });
  }

  // 200/201 = Upload complete
  if (googleRes.ok) {
    const data = await googleRes.json().catch(() => ({})) as { id?: string };
    // Clean up the session row now that the upload is done
    await supabaseAdmin.from("upload_sessions").delete().eq("id", sid);
    return NextResponse.json({ done: true, fileId: data.id ?? "" });
  }

  const errText = await googleRes.text();
  console.error("Drive chunk upload failed:", googleRes.status, errText.slice(0, 500));
  return NextResponse.json(
    { error: `Drive upload failed: ${googleRes.status}`, details: errText.slice(0, 500) },
    { status: googleRes.status >= 500 ? 502 : googleRes.status },
  );
}
