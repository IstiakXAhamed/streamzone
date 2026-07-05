import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows } = await supabase
    .from("saved_offline")
    .select("movie_id, saved_at, movie:movies(id,title,poster_url)")
    .eq("user_id", data.user.id)
    .order("saved_at", { ascending: false });

  const saved = (rows ?? []).map((r) => {
    const m = r.movie as unknown as { title?: string; poster_url?: string } | null;
    return {
      id: r.movie_id,
      title: m?.title ?? "Untitled",
      savedAt: r.saved_at,
      posterUrl: m?.poster_url ?? null,
    };
  });
  return NextResponse.json({ saved });
}
