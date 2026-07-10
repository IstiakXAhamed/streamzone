"use client";

import { useEffect, useRef, useCallback } from "react";

interface Props {
  src: string;
  title: string;
  poster?: string | null;
  subtitleSrc?: string | null;
  subtitleLabel?: string;
  movieId: string;
  movie: { slug: string; id: string } | null;
  /** If true, this user controls playback. If false, controls are locked (guest in party). */
  isHost?: boolean;
  /** Called when the host performs play/pause/seek so it can be broadcast to guests. */
  onControl?: (action: "play" | "pause" | "seek", time?: number) => void;
  /** Incoming sync command from the host (for guests). */
  syncCommand?: { action?: string; t?: number; at?: number } | null;
}

// Max drift allowed before forcing a seek correction (seconds)
const MAX_DRIFT = 1.5;
// How often the host broadcasts state (ms)
const HOST_SYNC_INTERVAL = 2000;
// How often guests check drift and correct (ms)
const GUEST_DRIFT_CHECK = 1000;

export function PlayerClient({ src, title, poster, movieId, isHost = true, onControl, syncCommand }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ignoreEvents = useRef(false);
  // Track the latest known host state for drift correction
  const hostState = useRef<{ time: number; playing: boolean; receivedAt: number }>({
    time: 0,
    playing: false,
    receivedAt: 0,
  });

  // Host: broadcast control events
  const handlePlay = useCallback(() => {
    if (!ignoreEvents.current && isHost && onControl && videoRef.current) {
      onControl("play", videoRef.current.currentTime);
    }
  }, [isHost, onControl]);

  const handlePause = useCallback(() => {
    if (!ignoreEvents.current && isHost && onControl && videoRef.current) {
      onControl("pause", videoRef.current.currentTime);
    }
  }, [isHost, onControl]);

  const handleSeeked = useCallback(() => {
    if (!ignoreEvents.current && isHost && onControl && videoRef.current) {
      onControl("seek", videoRef.current.currentTime);
    }
  }, [isHost, onControl]);

  // Host: broadcast current state frequently so guests stay synced
  useEffect(() => {
    if (!isHost || !onControl) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      // Always broadcast current state (playing or paused) with current time
      onControl(video.paused ? "pause" : "play", video.currentTime);
    }, HOST_SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [isHost, onControl]);

  // Guest: apply incoming sync commands from the host
  useEffect(() => {
    if (isHost || !syncCommand || !videoRef.current) return;
    const video = videoRef.current;

    // Update our record of host state
    hostState.current = {
      time: syncCommand.t ?? 0,
      playing: syncCommand.action === "play",
      receivedAt: Date.now(),
    };

    ignoreEvents.current = true;

    // Apply play/pause state
    if (syncCommand.action === "play") {
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else if (syncCommand.action === "pause") {
      if (!video.paused) {
        video.pause();
      }
    }

    // Seek if action is explicit seek, or if drift is too large
    if (syncCommand.t != null) {
      const drift = Math.abs(video.currentTime - syncCommand.t);
      if (syncCommand.action === "seek" || drift > MAX_DRIFT) {
        video.currentTime = syncCommand.t;
      }
    }

    setTimeout(() => { ignoreEvents.current = false; }, 200);
  }, [isHost, syncCommand]);

  // Guest: continuous drift correction — even between sync messages
  useEffect(() => {
    if (isHost) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      const hs = hostState.current;
      if (!video || !hs.receivedAt) return;

      // Estimate where the host should be NOW based on last known state + elapsed time
      let expectedTime = hs.time;
      if (hs.playing) {
        const elapsed = (Date.now() - hs.receivedAt) / 1000;
        expectedTime = hs.time + elapsed;
      }

      const drift = Math.abs(video.currentTime - expectedTime);
      if (drift > MAX_DRIFT) {
        ignoreEvents.current = true;
        video.currentTime = expectedTime;
        setTimeout(() => { ignoreEvents.current = false; }, 200);
      }

      // Ensure play state matches
      if (hs.playing && video.paused) {
        video.play().catch(() => {});
      } else if (!hs.playing && !video.paused) {
        video.pause();
      }
    }, GUEST_DRIFT_CHECK);
    return () => clearInterval(id);
  }, [isHost]);

  // Continue-watching history (only for host / solo watching)
  useEffect(() => {
    if (!isHost) return;
    const id = setInterval(async () => {
      const video = videoRef.current;
      if (!video) return;
      const pos = Math.floor(video.currentTime);
      if (pos > 0) {
        await fetch("/api/me/history", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ movieId, positionSeconds: pos }),
        }).catch(() => undefined);
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [isHost, movieId]);

  if (!src) return <p className="p-6 text-sm text-[color:var(--color-brand)]">Unable to load stream.</p>;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        preload="auto"
        playsInline
        controls={isHost}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
        className="h-full w-full object-contain"
      />
      {!isHost && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pb-3 pt-8">
          <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-[color:var(--color-text-secondary)]">
            🔒 Host controls playback
          </span>
        </div>
      )}
    </div>
  );
}
