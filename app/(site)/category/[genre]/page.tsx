import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { CategoryContent, type CategoryMovie } from "./_components/CategoryContent";

export const dynamic = "force-dynamic";

interface GenrePageProps { params: Promise<{ genre: string }>; }

export async function generateMetadata({ params }: GenrePageProps) {
  const { genre } = await params;
  return { title: `${genre} movies · MovieZone` };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { genre } = await params;
  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,year,poster_url,backdrop_url,rating,views_count,duration_seconds")
    .eq("is_public", true)
    .contains("genre", [genre])
    .order("views_count", { ascending: false })
    .limit(200);

  if (!data) notFound();

  const movies: CategoryMovie[] = data.map((m) => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
    year: m.year,
    rating: m.rating,
    poster_url: m.poster_url,
    backdrop_url: m.backdrop_url,
    duration_seconds: m.duration_seconds,
    views_count: m.views_count ?? 0,
  }));

  return <CategoryContent genre={genre} movies={movies} />;
}
