"use client";

import { useContinueWatching } from "@/hooks/useContinueWatching";
import { MovieCard, type MovieCardData } from "./MovieCard";
import type { WatchHistoryRow } from "@/hooks/useContinueWatching";

export function ContinueWatchingRow() {
  const { data } = useContinueWatching();
  const history: WatchHistoryRow[] = (data && "history" in data) ? data.history : [];
  if (history.length === 0) return null;

  const cards: MovieCardData[] = history
    .filter((h) => h.movie || h.episode)
    .map((h) => {
      if (h.movie) {
        return {
          id: h.movie_id!, title: h.movie.title, slug: h.movie.slug,
          poster_url: h.movie.poster_url, backdrop_url: null, year: null, rating: null,
        };
      }
      const ep = h.episode!;
      return {
        id: ep.id, title: ep.title, slug: "",
        poster_url: null, backdrop_url: null, year: null, rating: null,
      };
    });

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Continue watching</h2>
      <div className="mz-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {cards.map((c) => (
          <div key={c.id} className="mz-snap-start">
            <MovieCard movie={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
