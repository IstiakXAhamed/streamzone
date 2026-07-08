"use client";

import { useQuery } from "@tanstack/react-query";

/** Returns the proxied stream URL for an episode. */
export function useEpisodeStreamUrl(episodeId: string) {
  return useQuery({
    queryKey: ["stream-episode", episodeId],
    queryFn: () => {
      return Promise.resolve({
        url: `/api/stream/episode/${episodeId}`,
        title: "",
        id: episodeId,
        seriesId: "",
      });
    },
    staleTime: Infinity,
  });
}
