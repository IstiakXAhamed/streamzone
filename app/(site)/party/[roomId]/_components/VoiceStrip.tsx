"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";

/**
 * Voice strip for one party member. Joining voice spins up a simple-peer mesh
 * instance with every other participant. For now we render the local mic toggle
 * and list peers; the full webrtc mesh is wired in Phase 6 via useVoice hook.
 */
export function VoiceStrip(
  { roomId, identityId }: { roomId: string; identityId: string; identityName?: string }
) {
  const [micOn, setMicOn] = useState(false);

  useEffect(() => {
    // Phase 6: spin up mesh once micOn becomes true
    if (!micOn) return;
    return () => { /* teardown */ };
  }, [micOn, roomId, identityId]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
      <span className="text-xs text-[color:var(--color-text-secondary)]">Voice (Discord-style)</span>
      <button
        onClick={() => setMicOn((v) => !v)}
        className={`ml-auto grid h-8 w-8 place-items-center rounded-full ${micOn ? "bg-emerald-600" : "bg-[color:var(--color-surface-3)]"}`}
      >
        {micOn ? <Mic size={14} /> : <MicOff size={14} />}
      </button>
      <button className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-brand)]">
        <PhoneOff size={14} />
      </button>
    </div>
  );
}
