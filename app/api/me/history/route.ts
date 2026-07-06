import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/authOptions";
import type { NextRequest } from "next/server";

async function getUserId(email: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

/** GET /api/me/history?limit=20 — recent watch history + movie summary. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const userId = await getUserId(session.user.email);
  if (!userId) return NextResponse.json({ history: [] });

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("watch_history")
    .select("movie_id, episode_id, position_seconds, watched_at, movie:movies(id,title,slug,poster_url), episode:episodes(id,title,season_number,episode_number,series:series(id,slug))")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false })
    .limit(limit);

  return NextResponse.json({ history: rows ?? [] });
}

/** POST /api/me/history — { movieId | episodeId, positionSeconds } upserts a watch-history row. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId, episodeId, positionSeconds } = (await req.json()) as {
    movieId?: string; episodeId?: string; positionSeconds?: number;
  };
  if ((!movieId && !episodeId) || typeof positionSeconds !== "number") {
    return NextResponse.json(
      { error: "movieId or episodeId and positionSeconds required" },
      { status: 400 },
    );
  }

  const conflictKey = movieId ? "user_id,movie_id" : "user_id,episode_id";
  const supabase = await createClient();
  await supabase.from("watch_history").upsert(
    {
      user_id: userId,
      movie_id: movieId ?? null,
      episode_id: episodeId ?? null,
      position_seconds: Math.max(0, Math.floor(positionSeconds)),
      watched_at: new Date().toISOString(),
    },
    { onConflict: conflictKey },
  );
  return NextResponse.json({ ok: true });
}
