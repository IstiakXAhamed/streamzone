import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/movies/public?featured=true&limit=20
 * Public list endpoint for the homepage + carousels. Uses a service-role
 * client so it works for everyone; RLS equivalent is enforced by the
 * `is_public` filter.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const onlyFeatured = url.searchParams.get("featured") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 60);

  let query = supabaseAdmin
    .from("movies")
    .select("id,title,slug,description,year,genre,poster_url,backdrop_url,rating,views_count,duration_seconds,featured,created_at")
    .eq("is_public", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (onlyFeatured) query = query.eq("featured", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movies: data ?? [] });
}
