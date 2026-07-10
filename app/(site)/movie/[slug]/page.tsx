import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedMovie, getCachedCatalogue } from "@/lib/cache";
import { MovieDetailContent } from "./_components/MovieDetailContent";
import { relatedMovies } from "@/lib/ui/related";
import { Skeleton } from "@/components/ui/Skeleton";

// ISR: revalidate every 60 seconds instead of force-dynamic
export const revalidate = 60;

interface Movie {
  id: string; title: string; slug: string; description: string | null;
  year: number | null; duration_seconds: number | null; genre: string[];
  poster_url: string | null; backdrop_url: string | null; rating: number | null;
  trailer_drive_file_id: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getCachedMovie(slug);
  if (!movie) return { title: "Movie not found · MovieZone" };
  return { title: `${movie.title} · MovieZone`, description: movie.description ?? "" };
}

/** Related movies section streamed separately so the main content renders immediately */
async function RelatedSection({ movie }: { movie: Movie }) {
  const catalogue = await getCachedCatalogue(movie.id);

  const related = relatedMovies(
    { id: movie.id, genres: movie.genre },
    catalogue.map((m) => ({ id: m.id, genres: m.genre as string[] })),
  );
  const relatedIds = new Set(related.map((m) => m.id));

  const movieCards = catalogue
    .filter((m) => relatedIds.has(m.id))
    .map((m) => ({
      id: m.id, title: m.title, slug: m.slug, year: m.year, rating: m.rating,
      poster_url: m.poster_url, backdrop_url: m.backdrop_url, duration_seconds: m.duration_seconds,
    }));

  if (movieCards.length === 0) return null;
  return <MovieDetailContent movie={movie} related={movieCards} />;
}

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = await getCachedMovie(slug) as Movie | null;
  if (!movie) notFound();

  // Stream the related section while showing the main content immediately
  return (
    <Suspense fallback={<MovieDetailContent movie={movie} related={[]} />}>
      <RelatedSection movie={movie} />
    </Suspense>
  );
}
