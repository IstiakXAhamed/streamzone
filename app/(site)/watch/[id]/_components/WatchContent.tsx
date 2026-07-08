"use client";

import { useStreamUrl } from "@/hooks/useStreamUrl";
import { useMediaSession } from "@/hooks/useMediaSession";
import { PlayerClient } from "@/components/player/PlayerClient";

export function WatchContent({
  movieId, defaultPoster, defaultTitle, movie,
}: {
  movieId: string; defaultPoster: string | null; defaultTitle: string;
  movie: { slug: string; id: string } | null;
}) {
  const { data, error, isLoading } = useStreamUrl(movieId);
  useMediaSession(defaultTitle, "MovieZone", defaultPoster);

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
