import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { MovieRow, SeriesRow } from "@/types/db";

/**
 * Server-side data fetching with built-in caching via Next.js unstable_cache.
 * Eliminates redundant Supabase queries on every page load while still
 * revalidating periodically so content stays fresh.
 */

// ─── Public movies (home page) ───────────────────────────────────────────────

export const getCachedPublicMovies = unstable_cache(
  async (featured?: boolean): Promise<MovieRow[]> => {
    let query = supabaseAdmin
      .from("movies")
      .select("*")
      .eq("is_public", true)
      .order("featured", { ascending: false })
      .order("views_count", { ascending: false })
      .limit(40);
    if (featured) query = query.eq("featured", true);
    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as MovieRow[];
  },
  ["public-movies"],
  { revalidate: 60, tags: ["movies"] },
);

export const getCachedFeaturedMovies = unstable_cache(
  async (): Promise<MovieRow[]> => {
    const { data, error } = await supabaseAdmin
      .from("movies")
      .select("*")
      .eq("is_public", true)
      .eq("featured", true)
      .order("views_count", { ascending: false })
      .limit(8);
    if (error) return [];
    return (data ?? []) as MovieRow[];
  },
  ["featured-movies"],
  { revalidate: 60, tags: ["movies"] },
);

// ─── Public series (home page) ───────────────────────────────────────────────

export const getCachedPublicSeries = unstable_cache(
  async (): Promise<SeriesRow[]> => {
    const { data, error } = await supabaseAdmin
      .from("series")
      .select("id,title,slug,year,poster_url,backdrop_url,rating,seasons_count,episodes_count")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return [];
    return (data ?? []) as unknown as SeriesRow[];
  },
  ["public-series"],
  { revalidate: 120, tags: ["series"] },
);

// ─── Category / genre page ───────────────────────────────────────────────────

export const getCachedGenreMovies = unstable_cache(
  async (genre: string) => {
    const { data } = await supabaseAdmin
      .from("movies")
      .select("id,title,slug,year,poster_url,backdrop_url,rating,views_count,duration_seconds")
      .eq("is_public", true)
      .contains("genre", [genre])
      .order("views_count", { ascending: false })
      .limit(200);
    return data ?? [];
  },
  ["genre-movies"],
  { revalidate: 60, tags: ["movies"] },
);

// ─── Movie detail page ───────────────────────────────────────────────────────

export const getCachedMovie = unstable_cache(
  async (slug: string) => {
    const { data } = await supabaseAdmin
      .from("movies")
      .select("*")
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();
    return data;
  },
  ["movie-detail"],
  { revalidate: 60, tags: ["movies"] },
);

export const getCachedCatalogue = unstable_cache(
  async (excludeId: string) => {
    const { data } = await supabaseAdmin
      .from("movies")
      .select("id,title,slug,year,poster_url,backdrop_url,rating,views_count,duration_seconds,featured,created_at,genre")
      .eq("is_public", true)
      .neq("id", excludeId)
      .order("views_count", { ascending: false })
      .limit(200);
    return data ?? [];
  },
  ["movie-catalogue"],
  { revalidate: 120, tags: ["movies"] },
);
