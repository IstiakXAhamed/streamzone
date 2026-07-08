import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/authOptions";
import { getDriveFileStreamUrl } from "@/lib/googleDrive";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/stream/:movieId
 *
 * Proxies video bytes from Google Drive to the browser. This avoids CORS
 * issues (Google Drive's alt=media endpoint doesn't allow cross-origin
 * requests from <video> elements). Supports Range requests for seeking.
 *
 * The Vercel function streams the response — it doesn't buffer the entire
 * file. Each browser Range request is typically 1-4MB, well within limits.
 */
export async function GET(
  req: NextRequest,
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
  if (!urow || urow.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Build the Drive download URL with auth token
  const driveUrl = await getDriveFileStreamUrl(movie.drive_file_id, {
    readFromServiceAccount: true,
  });

  // Forward the browser's Range header to Google
  const headers: Record<string, string> = {};
  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    headers["Range"] = rangeHeader;
  }

  const driveRes = await fetch(driveUrl, { headers });

  if (!driveRes.ok && driveRes.status !== 206) {
    return NextResponse.json(
      { error: `Drive returned ${driveRes.status}` },
      { status: 502 },
    );
  }

  // Build response headers for the browser
  const resHeaders = new Headers();
  const contentType = driveRes.headers.get("content-type") ?? "video/mp4";
  resHeaders.set("Content-Type", contentType);
  resHeaders.set("Accept-Ranges", "bytes");

  const contentLength = driveRes.headers.get("content-length");
  if (contentLength) resHeaders.set("Content-Length", contentLength);

  const contentRange = driveRes.headers.get("content-range");
  if (contentRange) resHeaders.set("Content-Range", contentRange);

  // Cache the streamed bytes for performance (1 hour)
  resHeaders.set("Cache-Control", "private, max-age=3600");

  return new Response(driveRes.body, {
    status: driveRes.status, // 200 or 206
    headers: resHeaders,
  });
}
