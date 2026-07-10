/**
 * lib/ui/sort.ts
 * Movie sort comparators: Trending (views desc), Newest (year desc),
 * Highest Rated (rating desc), A–Z (case-insensitive asc). Stable & total.
 * (Req 7.4, 7.7, 13.3)
 */

export interface SortableMovie {
  title: string;
  year?: number | null;
  rating?: number | null;
  views_count: number;
}

export type SortKey = "trending" | "newest" | "highest-rated" | "a-z";

function num(n: number | null | undefined): number {
  return n == null ? -Infinity : n;
}

const comparators: Record<SortKey, (a: SortableMovie, b: SortableMovie) => number> = {
  trending: (a, b) => b.views_count - a.views_count,
  newest: (a, b) => num(b.year) - num(a.year),
  "highest-rated": (a, b) => num(b.rating) - num(a.rating),
  "a-z": (a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
};

/**
 * Sort a movie list by the given key. Stable (Array#sort is stable in
 * modern JS engines) and total (every pair is ordered, ties broken by
 * original index via stability).
 */
export function sortMovies<T extends SortableMovie>(movies: T[], key: SortKey): T[] {
  const cmp = comparators[key];
  return movies
    .map((movie, index) => ({ movie, index }))
    .sort((a, b) => {
      const primary = cmp(a.movie, b.movie);
      if (primary !== 0) return primary;
      return a.index - b.index; // stable tie-break
    })
    .map((entry) => entry.movie);
}
