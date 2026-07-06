"use client";

import { useQuery } from "@tanstack/react-query";

/** Fetch a direct stream URL for an approved, signed-in user. */
export function useEpisodeStreamUrl(episodeId: string) {
  return useQuery({
    queryKey: ["stream-episode", episodeId],
    queryFn: async () => {
      const res = await fetch(`/api/stream/episode/${episodeId}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Stream request failed: ${res.status}`);
      }
      return (await res.json()) as {
        url: string; title: string; id: string; seriesId: string;
      };
    },
    staleTime: Infinity,
  });
}
