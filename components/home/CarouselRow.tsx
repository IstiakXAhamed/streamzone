import Link from "next/link";
import { MovieCard, MovieCardData } from "./MovieCard";
import { SeriesCard, type SeriesCardData } from "./SeriesCard";

export function CarouselRow({
  title,
  movies,
}: {
  title: string;
  movies: MovieCardData[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="mz-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {movies.map((m) => (
          <div key={m.id} className="mz-snap-start">
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SeriesRow({
  title,
  series,
}: {
  title: string;
  series: SeriesCardData[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="mz-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {series.map((s) => (
          <div key={s.id} className="mz-snap-start">
            <SeriesCard movie={s} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HeroRow({
  title,
  movies,
}: {
  title: string;
  movies: MovieCardData[];
}) {
  return (
    <section className="relative">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div
        aria-label={title}
        className="mz-snap-x -mx-4 flex aspect-[16/7] gap-3 overflow-x-auto px-4 sm:-mx-6 sm:aspect-[16/6] sm:px-6 lg:-mx-8 lg:px-8"
      >
        {movies.map((m) => (
          <Link
            key={m.id}
            href={`/movie/${m.slug}`}
            className="mz-snap-start relative flex aspect-[16/7] w-[88vw] shrink-0 overflow-hidden rounded-2xl sm:w-[70vw]"
          >
            {m.backdrop_url || m.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.backdrop_url || m.poster_url || ""}
                alt={m.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-[color:var(--color-surface-2)] text-sm text-[color:var(--color-text-tertiary)]">
                {m.title}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="line-clamp-1 text-xl font-bold drop-shadow">{m.title}</p>
              <p className="text-xs text-[color:var(--color-text-secondary)]">
                {m.year ?? "—"} · {m.rating ? `${m.rating.toFixed(1)}★` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
