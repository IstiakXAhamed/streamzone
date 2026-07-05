"use client";

import { useQuery } from "@tanstack/react-query";
import type { MovieCardData } from "@/components/home/MovieCard";

export function usePublicMovies(featured = false, limit = 40) {
  return useQuery({
    queryKey: ["movies-public", featured, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (featured) params.set("featured", "true");
      const res = await fetch(`/api/movies/public?${params}`);
      const body = (await res.json()) as { movies: MovieCardData[] };
      return body.movies ?? [];
    },
    staleTime: 30_000,
  });
}
