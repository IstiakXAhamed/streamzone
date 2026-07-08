"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Returns the stream URL for a movie. Since we proxy bytes through our own
 * API route (to avoid Google Drive CORS), the URL is our own endpoint.
 * The <video> element makes Range requests to /api/stream/:movieId directly.
 */
export function useStreamUrl(movieId: string) {
  return useQuery({
    queryKey: ["stream", movieId],
    queryFn: () => {
      // No network call needed — the URL is deterministic.
      // Auth is validated when the <video> element actually fetches bytes.
      return Promise.resolve({
        url: `/api/stream/${movieId}`,
        title: "",
        id: movieId,
      });
    },
    staleTime: Infinity,
  });
}
