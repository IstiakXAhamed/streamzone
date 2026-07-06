import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/authOptions";
import { getDriveFileStreamUrl } from "@/lib/googleDrive";
import type { NextRequest } from "next/server";

/**
 * GET /api/stream/:movieId
 *
 * Returns a direct Google Drive stream URL for an approved user (NextAuth session).
 *
 * We never proxy bytes. We simply:
 *   1. confirm the NextAuth session + status === 'approved'
 *   2. look up the movie row
 *   3. build + return a Drive direct URL (service-account signed OR api-key)
 *
 * The browser then issues its own Range requests directly to Google.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ movieId: string }> },
) {
  const { movieId } = await params;

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
  if (!urow) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (urow.status !== "approved") {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const { data: movie } = await supabase
    .from("movies")
    .select("id,drive_file_id,is_public,title")
    .eq("id", movieId)
    .eq("is_public", true)
    .single();
  if (!movie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  // record a watch-history hit (best-effort)
  try {
    await supabase.from("watch_history").insert({
      user_id: urow.id,
      movie_id: movie.id,
      position_seconds: 0,
    });
  } catch {
    // ignore duplicates / transient errors
  }

  const url = await getDriveFileStreamUrl(movie.drive_file_id, {
    readFromServiceAccount: true,
  });

  return NextResponse.json({ url, title: movie.title, id: movie.id });
}
