import Link from "next/link";
import type { MovieCardData } from "./MovieCard";

export interface SeriesCardData extends MovieCardData {
  seasonsCount?: number;
  episodesCount?: number;
}

export function SeriesCard({ movie }: { movie: SeriesCardData }) {
  return (
    <Link
      href={`/series/${movie.slug}`}
      className="group relative flex w-36 shrink-0 flex-col gap-1 sm:w-44"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]">
        {movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:opacity-80"
          />
        ) : (
          <div className="grid h-full w-full place-items-center p-2 text-center text-xs text-[color:var(--color-text-tertiary)]">
            {movie.title}
          </div>
        )}
        <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          S{movie.seasonsCount ?? 1} · {movie.episodesCount ?? 0} EP
        </span>
      </div>
      <p className="line-clamp-1 text-sm font-medium">{movie.title}</p>
      <p className="text-xs text-[color:var(--color-text-tertiary)]">
        {movie.year ?? "—"} · {movie.rating ? `${movie.rating.toFixed(1)}★` : "unrated"}
      </p>
    </Link>
  );
}

export function SeriesCardSkeleton() {
  return (
    <div className="flex w-36 shrink-0 flex-col gap-2 sm:w-44">
      <div className="aspect-[2/3] rounded-xl mz-shimmer" />
      <div className="h-3 w-3/4 rounded-full mz-shimmer" />
      <div className="h-2 w-1/2 rounded-full mz-shimmer" />
    </div>
  );
}
