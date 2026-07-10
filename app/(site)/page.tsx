import { Suspense } from "react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Hero } from "@/components/hero/Hero";
import { CarouselRow, SeriesRow } from "@/components/carousel/CarouselRow";
import { ContinueWatchingRow } from "@/components/home/ContinueWatchingRow";
import { getCachedPublicMovies, getCachedFeaturedMovies, getCachedPublicSeries } from "@/lib/cache";
import { Skeleton } from "@/components/ui/Skeleton";
import { MovieCardSkeleton } from "@/components/home/MovieCard";

// Revalidate page-level cache every 60s (ISR) instead of force-dynamic
export const revalidate = 60;

function RowSkeleton() {
  return (
    <div>
      <Skeleton className="mb-3 h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Streamed section: featured hero + trending row */
async function FeaturedSection() {
  const featured = await getCachedFeaturedMovies();
  if (featured.length === 0) return null;

  const heroSlides = featured.slice(0, 8).map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    year: m.year,
    rating: m.rating,
    backdropUrl: m.backdrop_url,
    posterUrl: m.poster_url,
  }));

  return (
    <>
      {heroSlides.length > 0 && <Hero slides={heroSlides} />}
      {featured.length > 0 && (
        <CarouselRow title="Trending Now" movies={featured} seeAllHref="/category/trending" />
      )}
    </>
  );
}

/** Streamed section: recently added movies */
async function RecentSection() {
  const recent = await getCachedPublicMovies(false);
  if (recent.length === 0) return null;
  return <CarouselRow title="Recently Added" movies={recent} seeAllHref="/category/all" />;
}

/** Streamed section: series */
async function SeriesSection() {
  const seriesList = await getCachedPublicSeries();
  if (seriesList.length === 0) return null;
  return <SeriesRow title="Series" series={seriesList} seeAllHref="/series" />;
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  let isAdmin = false;
  const isAuthed = !!session?.user && session.user.status === "approved";

  if (isAuthed && session.user.email) {
    const { data: row } = await supabaseAdmin
      .from("users")
      .select("role")
      .ilike("email", session.user.email)
      .maybeSingle();
    isAdmin = row?.role === "admin" || row?.role === "superadmin";
  }

  // Quick check if catalogue is empty (cached, cheap)
  const recent = await getCachedPublicMovies(false);
  const isCompletelyEmpty = recent.length === 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      {isCompletelyEmpty ? (
        <section className="flex min-h-[70vh] flex-col justify-center gap-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Movies &amp; series.<br />
            <span className="text-[color:var(--color-brand)]">Stream together.</span>
          </h1>
          <p className="mx-auto max-w-prose text-[color:var(--color-text-secondary)]">
            {isAuthed
              ? "Your catalogue is empty. Head to the admin panel to ingest your first title."
              : "Sign in to browse the full catalogue and watch with friends in sync."}
          </p>
          {isAdmin ? (
            <Link
              href="/admin/movies"
              className="mx-auto rounded-full bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white"
            >
              Go to admin panel
            </Link>
          ) : (
            <Link
              href="/login"
              className="mx-auto rounded-full bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white"
            >
              {isAuthed ? "Browse catalogue" : "Sign in to start watching"}
            </Link>
          )}
        </section>
      ) : (
        <section className="space-y-8">
          <Suspense fallback={<Skeleton className="aspect-[16/7] w-full sm:aspect-[16/6]" rounded="lg" />}>
            <FeaturedSection />
          </Suspense>

          {isAuthed && <ContinueWatchingRow />}

          <Suspense fallback={<RowSkeleton />}>
            <RecentSection />
          </Suspense>

          <Suspense fallback={<RowSkeleton />}>
            <SeriesSection />
          </Suspense>
        </section>
      )}
    </main>
  );
}
