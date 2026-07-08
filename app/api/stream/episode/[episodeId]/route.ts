import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/authOptions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/stream/episode/:episodeId
 * Proxies episode video bytes from Google Drive. Supports Range requests.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> },
) {
  const { episodeId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createClient();
  const { data: urow } = await supabase
    .from("users")
    .select("id,status")
    .ilike("email", session.user.email)
    .maybeSingle();
  if (!urow || urow.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: episode } = await supabase
    .from("episodes")
    .select("id,drive_file_id,series_id,title")
    .eq("id", episodeId)
    .single();
  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const { data: series } = await supabase
    .from("series")
    .select("id,is_public")
    .eq("id", episode.series_id)
    .maybeSingle();
  if (!series?.is_public) {
    return NextResponse.json({ error: "Series not available" }, { status: 403 });
  }

  try {
    await supabase.from("watch_history").insert({
      user_id: urow.id,
      episode_id: episode.id,
      position_seconds: 0,
    });
  } catch { /* ignore duplicates */ }

  // Get fresh token and stream via Authorization header
  let token: string;
  try {
    const { getStorageAccountToken, getAccessToken } = await import("@/lib/googleDrive");
    try {
      token = await getStorageAccountToken();
    } catch {
      token = await getAccessToken();
    }
  } catch (e) {
    return NextResponse.json({ error: `Token error: ${(e as Error).message}` }, { status: 500 });
  }

  const driveUrl = `https://www.googleapis.com/drive/v3/files/${episode.drive_file_id}?alt=media&supportsAllDrives=true`;

  // Forward Range header for seeking support
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const rangeHeader = req.headers.get("range");
  if (rangeHeader) headers["Range"] = rangeHeader;

  const driveRes = await fetch(driveUrl, { headers });

  if (!driveRes.ok && driveRes.status !== 206) {
    return NextResponse.json({ error: `Drive returned ${driveRes.status}` }, { status: 502 });
  }

  const resHeaders = new Headers();
  resHeaders.set("Content-Type", driveRes.headers.get("content-type") ?? "video/mp4");
  resHeaders.set("Accept-Ranges", "bytes");
  const cl = driveRes.headers.get("content-length");
  if (cl) resHeaders.set("Content-Length", cl);
  const cr = driveRes.headers.get("content-range");
  if (cr) resHeaders.set("Content-Range", cr);
  resHeaders.set("Cache-Control", "private, max-age=3600");

  return new Response(driveRes.body, {
    status: driveRes.status,
    headers: resHeaders,
  });
}
