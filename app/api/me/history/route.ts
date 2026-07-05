import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

/** GET /api/me/history?limit=20 — recent watch history + movie summary. */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const { data: rows } = await supabase
    .from("watch_history")
    .select("movie_id, position_seconds, watched_at, movie:movies(id,title,slug,poster_url)")
    .eq("user_id", data.user.id)
    .order("watched_at", { ascending: false })
    .limit(limit);

  return NextResponse.json({ history: rows ?? [] });
}

/** POST /api/me/history — { movieId, positionSeconds } upserts a watch-history row. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId, positionSeconds } = (await req.json()) as {
    movieId?: string; positionSeconds?: number;
  };
  if (!movieId || typeof positionSeconds !== "number") {
    return NextResponse.json({ error: "movieId and positionSeconds required" }, { status: 400 });
  }

  await supabase.from("watch_history").upsert(
    {
      user_id: data.user.id,
      movie_id: movieId,
      position_seconds: Math.max(0, Math.floor(positionSeconds)),
      watched_at: new Date().toISOString(),
    },
    { onConflict: "user_id,movie_id" },
  );
  return NextResponse.json({ ok: true });
}
