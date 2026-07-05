import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Persists saved-offline metadata per user. The actual mp4 bytes live in the
 * browser; we save the row so the Saved tab renders even on a fresh launch.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId, title, sizeBytes } = (await req.json()) as {
    movieId?: string; title?: string; sizeBytes?: number;
  };
  if (!movieId || !title) {
    return NextResponse.json({ error: "movieId and title required" }, { status: 400 });
  }

  await supabase.from("saved_offline").upsert(
    {
      user_id: data.user.id,
      movie_id: movieId,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "user_id,movie_id" },
  );

  return NextResponse.json({ ok: true, sizeBytes });
}
