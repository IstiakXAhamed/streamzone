import { notFound } from "next/navigation";
import { getCachedGenreMovies } from "@/lib/cache";
import { CategoryContent, type CategoryMovie } from "./_components/CategoryContent";

// ISR: revalidate every 60s instead of force-dynamic
export const revalidate = 60;

interface GenrePageProps { params: Promise<{ genre: string }>; }

export async function generateMetadata({ params }: GenrePageProps) {
  const { genre } = await params;
  return { title: `${genre} movies · MovieZone` };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { genre } = await params;
  const data = await getCachedGenreMovies(genre);

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
