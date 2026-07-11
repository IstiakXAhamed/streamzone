import { supabaseAdmin } from "@/lib/supabase/admin";
import { SeriesCard, type SeriesCardData } from "@/components/home/SeriesCard";

export const revalidate = 60;

export const metadata = { title: "All Series · MovieZone" };

export default async function SeriesListPage() {
  const { data } = await supabaseAdmin
    .from("series")
    .select("id,title,slug,year,poster_url,backdrop_url,rating,seasons_count,episodes_count")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(100);

  const series: SeriesCardData[] = (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    year: s.year,
    rating: s.rating,
    poster_url: s.poster_url,
    backdrop_url: s.backdrop_url,
    seasonsCount: s.seasons_count,
    episodesCount: s.episodes_count,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">All Series</h1>

      {series.length === 0 ? (
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          No series available yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {series.map((s) => (
            <SeriesCard key={s.id} movie={s} />
          ))}
        </div>
      )}
    </div>
  );
}
