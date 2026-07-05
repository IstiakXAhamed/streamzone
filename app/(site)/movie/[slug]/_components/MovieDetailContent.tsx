import Link from "next/link";
import { CarouselRow } from "@/components/home/CarouselRow";
import type { MovieCardData } from "@/components/home/MovieCard";

interface Movie {
  id: string; title: string; slug: string; description: string | null;
  year: number | null; duration_seconds: number | null; genre: string[];
  poster_url: string | null; backdrop_url: string | null; rating: number | null;
  trailer_drive_file_id: string | null;
}

export function MovieDetailContent({ movie, related }: { movie: Movie; related: MovieCardData[] }) {
  const duration = movie.duration_seconds
    ? `${Math.floor(movie.duration_seconds / 60)}m`
    : null;

  return (
    <article>
      <div className="relative">
        <div className="absolute inset-0 -z-10 h-72 overflow-hidden sm:h-96">
          {movie.backdrop_url ?? movie.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.backdrop_url ?? movie.poster_url!} alt="" className="h-full w-full object-cover opacity-50" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-10 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] lg:px-8">
          <div className="mx-auto w-40 sm:mx-0 md:w-56">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[color:var(--color-surface-2)]">
              {movie.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center p-2 text-center text-xs text-[color:var(--color-text-tertiary)]">{movie.title}</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
              {movie.year && <span>{movie.year}</span>}
              {duration && <span>· {duration}</span>}
              {movie.rating && <span>· ★ {movie.rating.toFixed(1)}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {movie.genre.map((g) => (
                <Link key={g} href={`/category/${g.toLowerCase()}`} className="rounded-full border border-[color:color-mix(in_oklab,white_20%,transparent)] bg-white/5 px-3 py-0.5 text-xs">
                  {g}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/watch/${movie.id}`} className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white">
                ▶ Watch
              </Link>
              <button className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-3)] px-4 py-2 text-sm">
                + Save
              </button>
              <a href={`https://drive.google.com/uc?export=download&id=placeholder`} className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-3)] px-4 py-2 text-sm">
                ⬇ Download
              </a>
              <Link href="/party/create" className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-3)] px-4 py-2 text-sm">
                👥 Watch Party
              </Link>
            </div>

            {movie.description && <p className="max-w-prose text-sm text-[color:var(--color-text-secondary)]">{movie.description}</p>}
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <CarouselRow title="More like this" movies={related} />
      </section>
    </article>
  );
}
