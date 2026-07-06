import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/authOptions";
import { getDriveFileStreamUrl } from "@/lib/googleDrive";
import type { NextRequest } from "next/server";

/**
 * GET /api/stream/episode/:episodeId
 * Returns a direct Google Drive stream URL for an approved user (NextAuth session).
 */
export async function GET(
  _req: NextRequest,
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
    .eq("email", session.user.email.toLowerCase())
    .maybeSingle();
  if (!urow) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (urow.status !== "approved") {
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
      user_id: urow.id,
      episode_id: episode.id,
      position_seconds: 0,
    });
  } catch { /* ignore duplicates */ }

  const url = await getDriveFileStreamUrl(episode.drive_file_id, {
    readFromServiceAccount: true,
  });

  return NextResponse.json({ url, title: episode.title, id: episode.id, seriesId: episode.series_id });
}
