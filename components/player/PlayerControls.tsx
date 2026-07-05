"use client";

import { useEffect } from "react";
import type { PlyrInstance } from "plyr-react";

interface Props {
  player: PlyrInstance | undefined;
  title: string;
  visible: boolean;
  onToggle: () => void;
}

/** Lean-back overlay. Hides after a few seconds; tap to reveal. Skips 10s. */
export function PlayerControls({ player, title, visible, onToggle }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!player) return;
      if (e.key === " ") { e.preventDefault(); player.togglePlay(); }
      if (e.key === "ArrowRight") player.forward(10);
      if (e.key === "ArrowLeft") player.rewind(10);
      if (e.key === "f") player.fullscreen.toggle();
      if (e.key === "m") player.muted = !player.muted;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [player]);

  return (
    <div
      onClick={onToggle}
      className={`absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-black/40 transition-opacity ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="px-4 pt-12 lg:px-8">
        <h2 className="line-clamp-2 text-xl font-semibold drop-shadow">{title}</h2>
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs text-white/80 lg:px-8">
        <SkipButton onClick={() => player?.rewind(10)} label="-10" />
        <SkipButton onClick={() => player?.forward(10)} label="+10" />
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5">
          Space · ←/→ · f · m
        </span>
      </div>
    </div>
  );
}

function SkipButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/25"
    >
      {label}
    </button>
  );
}
