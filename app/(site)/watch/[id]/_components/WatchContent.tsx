"use client";

import { useMediaSession } from "@/hooks/useMediaSession";
import { PlayerClient } from "@/components/player/PlayerClient";

export function WatchContent({
  movieId, defaultPoster, defaultTitle, movie,
}: {
  movieId: string; defaultPoster: string | null; defaultTitle: string;
  movie: { slug: string; id: string } | null;
}) {
  useMediaSession(defaultTitle, "MovieZone", defaultPoster);

  // Stream URL is deterministic — no need for a query/loading state.
  // Auth is validated server-side when <video> makes its first Range request.
  const streamUrl = `/api/stream/${movieId}`;

  return (
    <div className="mx-auto grid w-full max-w-6xl place-items-stretch px-4 py-4">
      <PlayerClient
        src={streamUrl}
        title={defaultTitle}
        poster={defaultPoster}
        movieId={movieId}
        movie={movie}
      />
      <div className="mt-4 flex items-center gap-2">
        <a
          href={`/movie/${movie?.slug ?? movieId}`}
          className="rounded-full bg-[color:var(--color-surface-3)] px-4 py-2 text-sm"
        >
          Back to details
        </a>
        <a
          href={`/party/create?movie=${movieId}`}
          className="rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-medium text-white"
        >
          Watch with friends
        </a>
      </div>
    </div>
  );
}
