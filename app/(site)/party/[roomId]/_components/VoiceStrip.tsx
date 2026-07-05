"use client";

import { useMemo, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useVoice } from "@/lib/webrtc";
import type { PartyMessage, PresenceUser } from "@/lib/partyChannel";

export function VoiceStrip(
  props: {
    roomId: string; identityId: string;
    send: (msg: Omit<PartyMessage, "at">) => void;
    participants?: PresenceUser[];
    onMessage: PartyMessage;
  }
) {
  const [micOn, setMicOn] = useState(false);
  const enabled = true;
  const { levelList } = useVoice({
    enabled,
    selfId: props.identityId,
    participants: props.participants ?? [],
    send: props.send,
    onMessage: props.onMessage,
    micOn,
  });

  const speakerNames = useMemo(
    () => levelList.filter((p) => p.level > 0.05).map((p) => p.peerId.slice(0, 6)),
    [levelList]
  );

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
      <span className="text-xs text-[color:var(--color-text-secondary)]">
        Voice · {micOn ? "on" : "off"}
        {speakerNames.length > 0 ? ` · ${speakerNames.length} speaking` : ""}
      </span>
      <button
        onClick={() => setMicOn((v) => !v)}
        className={`ml-auto grid h-8 w-8 place-items-center rounded-full ${micOn ? "bg-emerald-600" : "bg-[color:var(--color-surface-3)]"}`}
      >
        {micOn ? <Mic size={14} /> : <MicOff size={14} />}
      </button>
      <button
        className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-brand)]"
        title="Leave voice"
        onClick={() => setMicOn(false)}
      >
        <PhoneOff size={14} />
      </button>
    </div>
  );
}
