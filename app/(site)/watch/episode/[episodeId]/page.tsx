import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { EpisodeWatchContent } from "./_components/EpisodeWatchContent";

export const dynamic = "force-dynamic";

export default async function EpisodeWatchPage({ params }: { params: Promise<{ episodeId: string }> }) {
  const { episodeId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.status !== "approved") redirect("/pending");

  const { data: episode } = await supabaseAdmin
    .from("episodes")
    .select("id,title,season_number,episode_number,series:series(id,slug,title)")
    .eq("id", episodeId)
    .maybeSingle();

  if (!episode) redirect("/");
  const series = episode.series as unknown as { id: string; slug: string; title: string } | null;
  if (!series) redirect("/");

  // find prev/next within the same series
  const { data: siblings } = await supabaseAdmin
    .from("episodes")
    .select("id,season_number,episode_number,title")
    .eq("series_id", series.id)
    .order("season_number", { ascending: true })
    .order("episode_number", { ascending: true });

  const eps = (siblings ?? []) as { id: string; season_number: number; episode_number: number; title: string }[];
  const idx = eps.findIndex((e) => e.id === episodeId);
  const prev = idx > 0 ? { id: eps[idx - 1].id, label: `S${eps[idx - 1].season_number}:E${eps[idx - 1].episode_number}` } : null;
  const next = idx >= 0 && idx < eps.length - 1 ? { id: eps[idx + 1].id, label: `S${eps[idx + 1].season_number}:E${eps[idx + 1].episode_number}` } : null;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex h-14 items-center gap-2 bg-black/70 px-4">
        <Link href={`/series/${series.slug}`} className="text-sm font-semibold text-[color:var(--color-brand)]">← {series.title}</Link>
        <span className="truncate text-sm">{episode.title}</span>
      </header>
      <EpisodeWatchContent
        episodeId={episode.id}
        defaultTitle={episode.title}
        defaultPoster={null}
        seriesSlug={series.slug}
        seriesTitle={series.title}
        prev={prev}
        next={next}
      />
    </div>
  );
}
