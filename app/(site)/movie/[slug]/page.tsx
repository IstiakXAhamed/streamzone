import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MovieDetailContent } from "./_components/MovieDetailContent";
import { relatedMovies } from "@/lib/ui/related";

export const dynamic = "force-dynamic";

interface Movie {
  id: string; title: string; slug: string; description: string | null;
  year: number | null; duration_seconds: number | null; genre: string[];
  poster_url: string | null; backdrop_url: string | null; rating: number | null;
  trailer_drive_file_id: string | null;
}

async function findBySlug(slug: string): Promise<Movie | null> {
  const { data } = await supabaseAdmin
    .from("movies")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  return (data as Movie | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const movie = await findBySlug(slug);
  if (!movie) return { title: "Movie not found · MovieZone" };
  return { title: `${movie.title} · MovieZone`, description: movie.description ?? "" };
}

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = await findBySlug(slug);
  if (!movie) notFound();

  const { data: catalogue } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,year,poster_url,backdrop_url,rating,views_count,duration_seconds,featured,created_at,genre")
    .eq("is_public", true)
    .neq("id", movie.id)
    .order("views_count", { ascending: false })
    .limit(200);

  const related = relatedMovies(
    { id: movie.id, genres: movie.genre },
    (catalogue ?? []).map((m) => ({ id: m.id, genres: m.genre as string[] })),
  );
  const relatedIds = new Set(related.map((m) => m.id));

  const movieCards = (catalogue ?? [])
    .filter((m) => relatedIds.has(m.id))
    .map((m) => ({
      id: m.id, title: m.title, slug: m.slug, year: m.year, rating: m.rating,
      poster_url: m.poster_url, backdrop_url: m.backdrop_url, duration_seconds: m.duration_seconds,
    }));
  return <MovieDetailContent movie={movie} related={movieCards} />;
}
