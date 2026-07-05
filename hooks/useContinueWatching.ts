"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MovieCardData } from "@/components/home/MovieCard";

interface WatchHistoryRow {
  movie_id: string;
  position_seconds: number;
  watched_at: string;
  movie: MovieCardData | null;
}

export function useContinueWatching() {
  return useQuery({
    queryKey: ["continue-watching"],
    queryFn: async () => {
      const res = await fetch("/api/me/history?limit=20");
      if (!res.ok) return [] as WatchHistoryRow[];
      return (await res.json()) as { history: WatchHistoryRow[] };
    },
    staleTime: 30_000,
  });
}

export function useReportProgress(movieId: string, positionSeconds: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/me/history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId, positionSeconds }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["continue-watching"] }),
  });
}
