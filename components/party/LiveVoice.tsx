"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  useRoomContext,
  useParticipants,
  useLocalParticipant,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";

interface Props {
  roomId: string;
}

export function LiveVoice({ roomId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const joinVoice = useCallback(async () => {
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Failed to get voice token");
        return;
      }
      const { token: t } = (await res.json()) as { token: string };
      setToken(t);
      setJoined(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [roomId]);

  if (!livekitUrl) {
    return (
      <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
        <span className="text-xs text-[color:var(--color-text-tertiary)]">Voice not configured</span>
      </div>
    );
  }

  if (!joined || !token) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
        <span className="text-xs text-[color:var(--color-text-secondary)]">Voice chat</span>
        <button
          onClick={joinVoice}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          <Phone size={12} /> Join voice
        </button>
        {error && <span className="text-xs text-[color:var(--color-brand)]">{error}</span>}
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
    >
      <VoicePanel onLeave={() => { setJoined(false); setToken(null); }} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function VoicePanel({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [micEnabled, setMicEnabled] = useState(true);

  const toggleMic = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(!micEnabled);
    setMicEnabled(!micEnabled);
  }, [localParticipant, micEnabled]);

  const leave = useCallback(() => {
    room.disconnect();
    onLeave();
  }, [room, onLeave]);

  return (
    <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-emerald-400">● Voice connected</span>
        <span className="text-xs text-[color:var(--color-text-tertiary)]">
          {participants.length} in call
        </span>
      </div>

      <ul className="mb-2 flex flex-wrap gap-1">
        {participants.map((p) => (
          <li
            key={p.identity}
            className={`rounded-full px-2 py-0.5 text-xs ${
              p.isSpeaking
                ? "bg-emerald-600/30 text-emerald-300 ring-1 ring-emerald-500"
                : "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-secondary)]"
            }`}
          >
            {p.name ?? p.identity?.slice(0, 8)}
            {p.isSpeaking && " 🔊"}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          className={`grid h-8 w-8 place-items-center rounded-full ${
            micEnabled ? "bg-emerald-600" : "bg-[color:var(--color-surface-3)]"
          }`}
          title={micEnabled ? "Mute" : "Unmute"}
        >
          {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
        </button>
        <button
          onClick={leave}
          className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-brand)]"
          title="Leave voice"
        >
          <PhoneOff size={14} />
        </button>
      </div>
    </div>
  );
}
