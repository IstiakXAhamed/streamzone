import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Keep the function alive long enough to finish piping a byte-range to slow
// connections. Without this, a large range over a slow mobile link can hit the
// default timeout mid-stream and cut off — which the viewer sees as buffering
// or a stall. (Matches the plan limit used by the upload route.)
export const maxDuration = 300;

// Run the streaming function close to viewers to cut the user↔Vercel latency
// (the biggest cause of buffering). Set this to the Vercel region nearest your
// audience. Common values:
//   "bom1" = Mumbai (South Asia)   "sin1" = Singapore (SE Asia)
//   "iad1" = US East               "fra1" = Frankfurt (Europe)
//   "lhr1" = London                "syd1" = Sydney
// Change this ONE value if most of your users are elsewhere.
export const preferredRegion = "bom1";

/**
 * In-memory caches to avoid hitting Supabase on every range request.
 * A single video playback can fire dozens of range requests; we don't
 * need to verify the user + movie for each one within a short window.
 */
const userCache = new Map<string, { status: string; id: string; expiresAt: number }>();
const movieCache = new Map<string, { drive_file_id: string; expiresAt: number }>();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 min
const MOVIE_CACHE_TTL = 10 * 60 * 1000; // 10 min

/**
 * GET /api/stream/:movieId
 *
 * Proxies video bytes from Google Drive to the browser. Supports Range
 * requests for seeking. Uses in-memory caching to avoid repeated DB
 * lookups during continuous playback.
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

  const email = session.user.email;
  const now = Date.now();

  // Check user authorization (cached for 5 min per email)
  let userInfo = userCache.get(email);
  if (!userInfo || userInfo.expiresAt < now) {
    const { data: urow } = await supabaseAdmin
      .from("users")
      .select("id,status")
      .ilike("email", email)
      .maybeSingle();
    if (!urow || urow.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userInfo = { status: urow.status, id: urow.id, expiresAt: now + USER_CACHE_TTL };
    userCache.set(email, userInfo);
  } else if (userInfo.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check movie existence (cached for 10 min per movieId)
  let movieInfo = movieCache.get(movieId);
  if (!movieInfo || movieInfo.expiresAt < now) {
    const { data: movie } = await supabaseAdmin
      .from("movies")
      .select("id,drive_file_id,is_public,title")
      .eq("id", movieId)
      .eq("is_public", true)
      .single();
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    movieInfo = { drive_file_id: movie.drive_file_id, expiresAt: now + MOVIE_CACHE_TTL };
    movieCache.set(movieId, movieInfo);
  }

  // Get a fresh Drive token
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

  const driveUrl = `https://www.googleapis.com/drive/v3/files/${movieInfo.drive_file_id}?alt=media&supportsAllDrives=true`;

  // Forward the browser's Range header to Google
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    headers["Range"] = rangeHeader;
  }

  const driveRes = await fetch(driveUrl, { headers });

  if (!driveRes.ok && driveRes.status !== 206) {
    const errBody = await driveRes.text().catch(() => "");
    console.error("Stream proxy failed:", driveRes.status, errBody.slice(0, 500));
    return NextResponse.json(
      { error: `Drive returned ${driveRes.status}`, details: errBody.slice(0, 300) },
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

  // Cache streamed bytes aggressively (browser-private, 2 hours)
  resHeaders.set("Cache-Control", "private, max-age=7200, stale-while-revalidate=3600");

  return new Response(driveRes.body, {
    status: driveRes.status, // 200 or 206
    headers: resHeaders,
  });
}
