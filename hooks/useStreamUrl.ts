"use client";

import { useQuery } from "@tanstack/react-query";

/** Fetch a direct stream URL for an approved, signed-in user. */
export function useStreamUrl(movieId: string) {
  return useQuery({
    queryKey: ["stream", movieId],
    queryFn: async () => {
      const res = await fetch(`/api/stream/${movieId}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Stream request failed: ${res.status}`);
      }
      return (await res.json()) as { url: string; title: string; id: string };
    },
    staleTime: Infinity,
  });
}
