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
  /** If true, this user controls playback. If false, controls are disabled (guest in party). */
  isHost?: boolean;
  /** Called when the host performs play/pause/seek so it can be broadcast to guests. */
  onControl?: (action: "play" | "pause" | "seek", time?: number) => void;
  /** Incoming sync command from the host (for guests). */
  syncCommand?: { action?: string; t?: number } | null;
}

export function PlayerClient({ src, title, poster, movieId, isHost = true, onControl, syncCommand }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ignoreEvents = useRef(false); // prevents echo when applying sync commands

  // Host: broadcast control events when user interacts with the player
  const handlePlay = useCallback(() => {
    if (!ignoreEvents.current && isHost && onControl) {
      onControl("play", videoRef.current?.currentTime);
    }
  }, [isHost, onControl]);

  const handlePause = useCallback(() => {
    if (!ignoreEvents.current && isHost && onControl) {
      onControl("pause", videoRef.current?.currentTime);
    }
  }, [isHost, onControl]);

  const handleSeeked = useCallback(() => {
    if (!ignoreEvents.current && isHost && onControl && videoRef.current) {
      onControl("seek", videoRef.current.currentTime);
    }
  }, [isHost, onControl]);

  // Guest: apply incoming sync commands from the host
  useEffect(() => {
    if (isHost || !syncCommand || !videoRef.current) return;
    const video = videoRef.current;
    ignoreEvents.current = true;

    if (syncCommand.action === "seek" && syncCommand.t != null) {
      video.currentTime = syncCommand.t;
    }
    if (syncCommand.action === "play") {
      if (syncCommand.t != null) video.currentTime = syncCommand.t;
      video.play().catch(() => {});
    }
    if (syncCommand.action === "pause") {
      if (syncCommand.t != null) video.currentTime = syncCommand.t;
      video.pause();
    }

    // Re-enable event broadcasting after a short delay
    setTimeout(() => { ignoreEvents.current = false; }, 300);
  }, [isHost, syncCommand]);

  // Periodic time sync: host broadcasts current time every 5s so late-joiners catch up
  useEffect(() => {
    if (!isHost || !onControl) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        onControl("play", video.currentTime);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [isHost, onControl]);

  // Continue-watching history (only for solo watching, skip in party as guest)
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
        playsInline
        controls={isHost} // Only host sees native controls
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
        className="h-full w-full object-contain"
      />
      {!isHost && (
        <div className="absolute inset-0 z-10 flex items-end justify-center pb-4">
          <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-[color:var(--color-text-secondary)]">
            Host controls playback
          </span>
        </div>
      )}
    </div>
  );
}
