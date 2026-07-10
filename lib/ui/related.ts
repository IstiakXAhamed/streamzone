/**
 * lib/ui/related.ts
 * relatedMovies(current, catalogue) — shares >=1 genre, excludes self, capped at 20.
 * (Req 6.6)
 */

export interface RelatedMovieCandidate {
  id: string;
  genres: string[];
}

export function relatedMovies<T extends RelatedMovieCandidate>(current: T, catalogue: T[]): T[] {
  const currentGenres = new Set(current.genres);
  return catalogue
    .filter((movie) => movie.id !== current.id)
    .filter((movie) => movie.genres.some((g) => currentGenres.has(g)))
    .slice(0, 20);
}
