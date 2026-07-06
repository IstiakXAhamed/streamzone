"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MovieCardData } from "@/components/home/MovieCard";

export interface WatchHistoryRow {
  movie_id: string | null;
  episode_id: string | null;
  position_seconds: number;
  watched_at: string;
  movie: MovieCardData | null;
  episode: {
    id: string; title: string; season_number: number; episode_number: number;
    series: { id: string; slug: string } | null;
  } | null;
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

export function useReportProgress(input: { movieId?: string; episodeId?: string }) {
  const qc = useQueryClient();
  return (positionSeconds: number) => {
    fetch("/api/me/history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, positionSeconds }),
    }).then(() => qc.invalidateQueries({ queryKey: ["continue-watching"] })).catch(() => undefined);
  };
}
