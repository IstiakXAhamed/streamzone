import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDriveFileStreamUrl } from "@/lib/googleDrive";
import type { NextRequest } from "next/server";

/**
 * GET /api/stream/episode/:episodeId
 * Returns a direct Google Drive stream URL for an approved user. Bytes travel
 * browser -> Google; our server only verifies + records history.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> },
) {
  const { episodeId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: urow } = await supabase
    .from("users")
    .select("status")
    .eq("id", data.user.id)
    .single();
  if (!urow || urow?.status !== "approved") {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const { data: episode } = await supabase
    .from("episodes")
    .select("id,drive_file_id,series_id,title")
    .eq("id", episodeId)
    .single();
  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  // ensure parent series is public
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
      user_id: data.user.id,
      episode_id: episode.id,
      position_seconds: 0,
    });
  } catch { /* ignore duplicates */ }

  const url = await getDriveFileStreamUrl(episode.drive_file_id, {
    readFromServiceAccount: true,
  });

  return NextResponse.json({ url, title: episode.title, id: episode.id, seriesId: episode.series_id });
}
