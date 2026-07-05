"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePlyr, type PlyrInstance, type PlyrSource } from "plyr-react";
import type { APITypes } from "plyr-react";
import "@/styles/plyr.local.css";
import { PlayerControls } from "./PlayerControls";

interface Props {
  src: string;
  title: string;
  poster?: string | null;
  subtitleSrc?: string | null;
  subtitleLabel?: string;
  movieId: string;
  movie: { slug: string; id: string } | null;
}

export function PlayerClient({ src, title, poster, subtitleSrc, subtitleLabel, movieId }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [instance, setInstance] = useState<PlyrInstance | undefined>();

  const plyrSource: PlyrSource = {
    type: "video",
    title,
    sources: [{ src, type: "video/mp4", size: 720 }],
    ...(subtitleSrc
      ? { tracks: [{ kind: "captions", label: subtitleLabel ?? "English", srcLang: "en", src: subtitleSrc, default: false }] }
      : {}),
  };

  usePlyr(videoRef as React.Ref<APITypes>, { source: plyrSource, options: {} }, [src]);

  useEffect(() => {
    const attach = () => {
      const api = (videoRef.current as unknown as { plyr?: PlyrInstance } | null)?.plyr;
      if (api) setInstance(api);
    };
    attach();
    const id = window.setInterval(() => attach(), 500);
    return () => window.clearInterval(id);
  }, [src]);

  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toggleControls = useCallback(() => {
    setShowControls((s) => {
      const next = !s;
      if (next) {
        hideTimer.current && clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowControls(false), 3200);
      }
      return next;
    });
  }, []);

  // continue-watching: resume position; report progress periodically
  useEffect(() => {
    let disposed = false;
    const resume = async () => {
      try {
        const r = await fetch(`/api/me/history/${movieId}`);
        const body = (await r.json().catch(() => ({}))) as { position?: number };
        if (!disposed && body.position && instance) instance.forward(body.position);
      } catch { /* no history yet */ }
    };
    if (instance) resume();

    const id = window.setInterval(async () => {
      if (!instance) return;
      const pos = Math.floor(instance.currentTime ?? 0);
      if (pos > 0 && pos % 15 === 0) {
        await fetch("/api/me/history", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ movieId, positionSeconds: pos }),
        }).catch(() => undefined);
      }
    }, 15_000);
    return () => {
      disposed = true;
      window.clearInterval(id);
    };
  }, [instance, movieId]);

  if (!src) return <p className="p-6 text-sm text-[color:var(--color-brand)]">Unable to load stream.</p>;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video ref={videoRef} poster={poster ?? undefined} playsInline className="h-full w-full object-contain" />
      <div onClick={toggleControls} className="absolute inset-0 z-[1]" />
      <PlayerControls player={instance} title={title} visible={showControls} onToggle={toggleControls} />
    </div>
  );
}
