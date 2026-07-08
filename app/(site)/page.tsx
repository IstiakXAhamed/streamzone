import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { HeroRow } from "@/components/home/CarouselRow";
import { CarouselRow } from "@/components/home/CarouselRow";
import { SeriesRow } from "@/components/home/CarouselRow";
import { ContinueWatchingRow } from "@/components/home/ContinueWatchingRow";
import type { MovieRow, SeriesRow as SeriesRowType } from "@/types/db";

async function getPublicMovies(featured?: boolean): Promise<MovieRow[]> {
  try {
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
  } catch {
    return [];
  }
}

async function getPublicSeries(): Promise<SeriesRowType[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("series")
      .select("id,title,slug,year,poster_url,backdrop_url,rating,seasons_count,episodes_count")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return [];
    return (data ?? []) as unknown as SeriesRowType[];
  } catch {
    return [];
  }
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

  const [featured, recent, seriesList] = await Promise.all([
    getPublicMovies(true),
    getPublicMovies(false),
    getPublicSeries(),
  ]);

  const isCompletelyEmpty = recent.length === 0 && seriesList.length === 0;

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
          {featured.length > 0 && <HeroRow title="Featured" movies={featured} />}
          {seriesList.length > 0 && <SeriesRow title="Series" series={seriesList} />}
          {isAuthed && <ContinueWatchingRow />}
          {featured.length > 0 && <CarouselRow title="Trending now" movies={featured} />}
          <CarouselRow title="Recently added" movies={recent} />
        </section>
      )}
    </main>
  );
}
