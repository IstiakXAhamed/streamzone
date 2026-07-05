"use client";

import { useEffect } from "react";

/** Wire the media session metadata + handlers so Android/car/headphone controls work. */
export function useMediaSession(title: string, artist: string, posterUrl: string | null) {
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        artwork: posterUrl ? [{ src: posterUrl, sizes: "512x512", type: "image/png" }] : [],
      });
    } catch { /* unsupported metadata shape */ }

    const noop = () => undefined as unknown as MediaSessionActionHandler;
    const playH = () => { document.querySelector<HTMLVideoElement>("video")?.play?.(); };
    const pauseH = () => { document.querySelector<HTMLVideoElement>("video")?.pause?.(); };
    const backH = () => { const v = document.querySelector<HTMLVideoElement>("video"); if (v) v.currentTime = Math.max(0, v.currentTime - 10); };
    const fwdH = () => { const v = document.querySelector<HTMLVideoElement>("video"); if (v) v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10); };

    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported */ }
    };
    set("play", playH);
    set("pause", pauseH);
    set("seekbackward", backH);
    set("seekforward", fwdH);
    return () => {
      set("play", null);
      set("pause", null);
      set("seekforward", null);
      set("seekbackward", null);
    };
    void noop;
  }, [title, artist, posterUrl]);
}
