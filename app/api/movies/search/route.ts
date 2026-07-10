import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/movies/search?q=term
 * Backs the SearchOverlay (Req 18.2): up to 10 public movies matching the
 * query, case-insensitive, with poster/title/year for display.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ movies: [] });

  const { data, error } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,year,poster_url")
    .eq("is_public", true)
    .ilike("title", `%${q}%`)
    .order("views_count", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 500 });
  return NextResponse.json({ movies: data ?? [] });
}
