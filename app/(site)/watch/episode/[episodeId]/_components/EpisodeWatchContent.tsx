"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useEpisodeStreamUrl } from "@/hooks/useEpisodeStreamUrl";
import { useMediaSession } from "@/hooks/useMediaSession";
import { useReportProgress } from "@/hooks/useContinueWatching";
import { PlayerClient } from "@/components/player/PlayerClient";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Neighbor = { id: string; label: string } | null;

export function EpisodeWatchContent({
  episodeId, defaultTitle, defaultPoster, seriesSlug, seriesTitle,
  prev, next,
}: {
  episodeId: string; defaultTitle: string; defaultPoster: string | null;
  seriesSlug: string; seriesTitle: string;
  prev: Neighbor; next: Neighbor;
}) {
  const { data, error, isLoading } = useEpisodeStreamUrl(episodeId);
  useMediaSession(defaultTitle, seriesTitle, defaultPoster);
  const reportProgress = useReportProgress({ episodeId });

  useEffect(() => {
    const id = window.setInterval(() => {
      const v = document.querySelector<HTMLVideoElement>("video");
      if (v && !v.paused) reportProgress(Math.floor(v.currentTime));
    }, 15_000);
    return () => window.clearInterval(id);
  }, [reportProgress]);

  if (isLoading) {
    return (
      <div className="mx-auto grid aspect-video w-full max-w-6xl place-items-center px-4">
        <p className="text-sm text-[color:var(--color-text-secondary)]">Preparing stream…</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto grid aspect-video w-full max-w-6xl place-items-center px-4">
        <p className="text-sm text-[color:var(--color-brand)]">
          Could not load stream: {error?.message ?? "unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl place-items-stretch px-4 py-4">
      <PlayerClient
        src={data.url}
        title={defaultTitle}
        poster={defaultPoster}
        movieId={episodeId}
        movie={{ slug: seriesSlug, id: episodeId }}
      />
      <div className="mt-4 flex items-center justify-between gap-2">
        {prev ? (
          <Link href={`/watch/episode/${prev.id}`} className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-3)] px-4 py-2 text-sm">
            <ChevronLeft size={14} /> {prev.label}
          </Link>
        ) : <span />}
        <Link href={`/series/${seriesSlug}`} className="rounded-full bg-[color:var(--color-surface-3)] px-4 py-2 text-sm">
          ← Back to series
        </Link>
        {next ? (
          <Link href={`/watch/episode/${next.id}`} className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white">
            {next.label} <ChevronRight size={14} />
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
