import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SeriesDetailContent } from "./_components/SeriesDetailContent";
import type { SeriesRow } from "@/types/db";
import type { MovieCardData } from "@/components/home/MovieCard";

export const dynamic = "force-dynamic";

type Series = SeriesRow;

async function findBySlug(slug: string): Promise<Series | null> {
  const { data } = await supabaseAdmin
    .from("series")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  return (data as Series | null) ?? null;
}

async function getEpisodes(seriesId: string) {
  const { data } = await supabaseAdmin
    .from("episodes")
    .select("id,season_number,episode_number,title,duration_seconds,air_date,still_url")
    .eq("series_id", seriesId)
    .order("season_number", { ascending: true })
    .order("episode_number", { ascending: true });
  return data ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await findBySlug(slug);
  if (!series) return { title: "Series not found · MovieZone" };
  return { title: `${series.title} · MovieZone`, description: series.description ?? "" };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await findBySlug(slug);
  if (!series) notFound();

  const episodes = await getEpisodes(series.id);
  const seasonsMap = new Map<number, typeof episodes>();
  for (const ep of episodes) {
    if (!seasonsMap.has(ep.season_number)) seasonsMap.set(ep.season_number, []);
    seasonsMap.get(ep.season_number)!.push(ep);
  }

  const { data: relatedRaw } = await supabaseAdmin
    .from("series")
    .select("id,title,slug,year,poster_url,backdrop_url,rating,seasons_count,episodes_count")
    .eq("is_public", true)
    .neq("id", series.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const related = (relatedRaw ?? []).map((s) => ({
    id: s.id, title: s.title, slug: s.slug, year: s.year, rating: s.rating,
    poster_url: s.poster_url, backdrop_url: s.backdrop_url,
    seasonsCount: s.seasons_count, episodesCount: s.episodes_count,
  })) as (MovieCardData & { seasonsCount: number; episodesCount: number })[];
  void related;

  return (
    <SeriesDetailContent
      series={series}
      seasons={Object.fromEntries(
        [...seasonsMap.entries()].map(([k, v]) => [k, v]),
      )}
    />
  );
}
