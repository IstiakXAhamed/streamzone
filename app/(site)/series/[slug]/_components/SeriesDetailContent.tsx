"use client";

import { useState } from "react";
import Link from "next/link";

interface Series {
  id: string; title: string; slug: string; description: string | null;
  year: number | null; genre: string[]; poster_url: string | null;
  backdrop_url: string | null; rating: number | null;
  seasons_count: number; episodes_count: number;
  status: "ongoing" | "completed" | "hiatus";
}

interface Episode {
  id: string; season_number: number; episode_number: number; title: string;
  duration_seconds: number | null; air_date: string | null;
}

export function SeriesDetailContent({
  series, seasons,
}: {
  series: Series;
  seasons: Record<number, Episode[]>;
}) {
  const seasonNumbers = Object.keys(seasons).map(Number).sort((a, b) => a - b);
  const [activeSeason, setActiveSeason] = useState(seasonNumbers[0] ?? 1);
  const activeEpisodes = seasons[activeSeason] ?? [];

  return (
    <article>
      <div className="relative">
        <div className="absolute inset-0 -z-10 h-72 overflow-hidden sm:h-96">
          {series.backdrop_url ?? series.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={series.backdrop_url ?? series.poster_url!} alt="" className="h-full w-full object-cover opacity-50" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-10 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] lg:px-8">
          <div className="mx-auto w-40 sm:mx-0 md:w-56">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[color:var(--color-surface-2)]">
              {series.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={series.poster_url} alt={series.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center p-2 text-center text-xs text-[color:var(--color-text-tertiary)]">{series.title}</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">{series.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
              {series.year && <span>{series.year}</span>}
              <span>· {series.seasons_count} season(s)</span>
              <span>· {series.episodes_count} episode(s)</span>
              {series.rating && <span>· ★ {series.rating.toFixed(1)}</span>}
              <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs uppercase">{series.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {series.genre.map((g) => (
                <Link key={g} href={`/category/${g.toLowerCase()}`} className="rounded-full border border-[color:color-mix(in_oklab,white_20%,transparent)] bg-white/5 px-3 py-0.5 text-xs">
                  {g}
                </Link>
              ))}
            </div>
            {series.description && <p className="max-w-prose text-sm text-[color:var(--color-text-secondary)]">{series.description}</p>}
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {seasonNumbers.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSeason(s)}
              className={`rounded-full px-4 py-1.5 text-sm ${s === activeSeason ? "bg-[color:var(--color-brand)] text-white" : "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-secondary)]"}`}
            >Season {s}</button>
          ))}
        </div>

        <ul className="space-y-2">
          {activeEpisodes.length === 0 && (
            <li className="text-sm text-[color:var(--color-text-tertiary)]">No episodes in this season yet.</li>
          )}
          {activeEpisodes.map((ep) => (
            <li key={ep.id} className="flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--color-surface-3)] text-sm font-semibold text-white">{ep.episode_number}</span>
                <div>
                  <p className="text-sm font-medium text-white">{ep.title}</p>
                  <p className="text-xs text-[color:var(--color-text-tertiary)]">
                    {ep.duration_seconds ? `${Math.floor(ep.duration_seconds / 60)}m` : ""}
                    {ep.air_date ? ` · ${ep.air_date}` : ""}
                  </p>
                </div>
              </div>
              <Link href={`/watch/episode/${ep.id}`} className="rounded-full bg-[color:var(--color-brand)] px-4 py-1.5 text-xs font-semibold text-white">▶ Watch</Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
