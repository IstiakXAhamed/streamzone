/**
 * lib/ui/watch-stats.ts
 * computeWatchStats (unique movies, total hours, favorite genre) and
 * continueWatching (in-progress filter, ordered, capped).
 * (Req 12.2, 12.3, 12.4)
 */

export interface WatchStatsEntry {
  movieId: string;
  positionSeconds: number;
  durationSeconds: number;
  watchedAt: string; // ISO timestamp
  genres: string[];
}

export interface WatchStats {
  uniqueMovies: number;
  totalHours: number;
  favoriteGenre: string | null;
}

/**
 * Aggregate watch statistics: unique movie count, rounded total hours,
 * and the favorite genre (most distinct-movie coverage), or null if empty.
 */
export function computeWatchStats(history: WatchStatsEntry[]): WatchStats {
  if (history.length === 0) {
    return { uniqueMovies: 0, totalHours: 0, favoriteGenre: null };
  }

  const uniqueMovieIds = new Set(history.map((h) => h.movieId));
  const totalSeconds = history.reduce((sum, h) => sum + h.positionSeconds, 0);
  const totalHours = Math.round(totalSeconds / 3600);

  // favoriteGenre = genre with the highest count of DISTINCT watched movies.
  const genreToMovies = new Map<string, Set<string>>();
  for (const entry of history) {
    for (const genre of entry.genres) {
      if (!genreToMovies.has(genre)) genreToMovies.set(genre, new Set());
      genreToMovies.get(genre)!.add(entry.movieId);
    }
  }

  let favoriteGenre: string | null = null;
  let maxCount = 0;
  for (const [genre, movies] of genreToMovies) {
    if (movies.size > maxCount) {
      maxCount = movies.size;
      favoriteGenre = genre;
    }
  }

  return { uniqueMovies: uniqueMovieIds.size, totalHours, favoriteGenre };
}

export interface ContinueWatchingEntry extends WatchStatsEntry {
  title: string;
}

/**
 * Filter to in-progress items (0 < position < 90% duration), ordered by
 * most-recently-watched first, capped at 30.
 */
export function continueWatching<T extends ContinueWatchingEntry>(history: T[]): T[] {
  return history
    .filter((h) => h.durationSeconds > 0 && h.positionSeconds > 0 && h.positionSeconds < h.durationSeconds * 0.9)
    .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
    .slice(0, 30);
}
