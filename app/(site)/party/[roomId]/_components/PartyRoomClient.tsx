"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlayerClient } from "@/components/player/PlayerClient";
import { useStreamUrl } from "@/hooks/useStreamUrl";
import { joinPartyChannel, type PartyHandle, type PartyMessage, type PresenceUser } from "@/lib/partyChannel";
import { ChatPanel } from "./ChatPanel";
import { VoiceStrip } from "./VoiceStrip";
import { Copy } from "lucide-react";

export function PartyRoomClient({
  roomId, movieId, initialMovieTitle, hostUserId,
  identityId, identityName, identityStatus,
}: {
  roomId: string; movieId: string; initialMovieTitle: string;
  hostUserId: string; identityId: string | null; identityName: string;
  identityStatus: string | null;
}) {
  const isHost = identityId === hostUserId;
  const { data: stream, error: streamError, isLoading } = useStreamUrl(movieId);
  type RoomChatItem = { by: string; name: string; text: string; at: number };

  const [participants, setParticipants] = useState<PresenceUser[]>([]);
  const [chat, setChat] = useState<RoomChatItem[]>([]);
  const [lastVoiceMessage, setLastVoiceMessage] = useState<PartyMessage | null>(null);

  const partyRef = useRef<PartyHandle | null>(null);
  const sendRef = useRef<((msg: Omit<PartyMessage, "at">) => PartyMessage) | null>(null);

  const handleSend = useCallback((msg: Omit<PartyMessage, "at">) => {
    sendRef.current?.(msg);
  }, []);

  // Join channel + route messages
  useEffect(() => {
    if (!identityId || identityStatus !== "approved") return;
    const party = joinPartyChannel(roomId, { id: identityId, name: identityName });
    partyRef.current = party;
    party
      .subscribe()
      .then(() => flattenPresence(party.presence()));
    const offMsg = party.onMessage((msg: PartyMessage) => {
      if (msg.kind === "chat" && msg.by !== identityId) {
        setChat((c) => [...c, { by: msg.by, name: msg.name ?? msg.by, text: msg.text ?? "", at: msg.at }]);
      }
      if (msg.kind === "voice-sdp" || msg.kind === "voice-ice") {
        setLastVoiceMessage(msg);
      }
    });
    sendRef.current = party.send;
    const sync = window.setInterval(() => {
      flattenPresence(party.presence());
    }, 2500);

    return () => {
      offMsg();
      clearInterval(sync);
      party.leave();
      partyRef.current = null;
    };
    function flattenPresence(state: Record<string, PresenceUser[]>) {
      const list: PresenceUser[] = [];
      for (const key of Object.keys(state)) {
        for (const u of state[key]) list.push(u);
      }
      setParticipants(list);
    }
  }, [identityId, identityStatus, roomId, identityName]);

  const handleChat = useCallback((text: string) => {
    if (!identityId) return;
    partyRef.current?.send({ kind: "chat", text, by: identityId, name: identityName } as Omit<PartyMessage, "at">);
    setChat((c) => [...c, { by: identityId, name: identityName, text, at: Date.now() }]);
  }, [identityId, identityName]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    alert("Party link copied — share it with friends!");
  }

  if (identityStatus === "pending") return <Gate label="Awaiting approval" />;
  if (identityStatus === "suspended") return <Gate label="Suspended" />;
  if (!identityId) return <Gate label="Sign in to join" to="/login" />;

  return (
    <main className="mx-auto flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center gap-3 border-b border-[color:var(--color-border-subtle)] px-4 py-3">
        <span className="text-sm font-bold text-[color:var(--color-brand)]">Party</span>
        <span className="truncate text-sm">{initialMovieTitle}</span>
        <span className="rounded-full bg-[color:var(--color-brand)]/20 px-2 py-0.5 text-xs text-[color:var(--color-brand)]">
          {isHost ? "Host" : "Guest"}
        </span>
        <button onClick={copyLink} className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface-3)]" title="Copy invite link">
          <Copy size={14} />
        </button>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[1fr_320px] lg:p-5">
        <div className="space-y-3">
          <PlayerBlock
            title={initialMovieTitle}
            stream={stream}
            streamError={streamError?.message ?? null}
            isLoading={isLoading}
            movieId={movieId}
            movie={{ slug: "party", id: movieId }}
          />
          <VoiceStrip roomId={roomId} identityId={identityId} participants={participants} send={handleSend} onMessage={lastVoiceMessage ?? ({ kind: "chat", by: "", text: "", at: 0 })} />
        </div>
        <aside className="flex flex-col gap-3">
          <section className="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-[color:var(--color-text-tertiary)]">
              In the room ({participants.length})
            </h3>
            <ul className="space-y-1">
              {participants.map((p) => (
                <li key={p.presenceRef + p.userId} className="text-sm">
                  {p.userId === hostUserId ? "👑 " : ""}{p.name ?? p.userId}
                </li>
              ))}
            </ul>
          </section>
          <ChatPanel chat={chat} onSend={handleChat} />
        </aside>
      </div>
    </main>
  );
}

function PlayerBlock({
  title, stream, streamError, isLoading, movieId, movie,
}: {
  title: string;
  stream: { url: string; id: string; title: string } | undefined;
  streamError: string | null;
  isLoading: boolean;
  movieId: string;
  movie: { slug: string; id: string };
}) {
  if (isLoading) return <div className="grid aspect-video place-items-center rounded-xl bg-[color:var(--color-surface-2)]"><p className="text-sm">Preparing stream…</p></div>;
  if (streamError || !stream) return <div className="grid aspect-video place-items-center rounded-xl bg-[color:var(--color-surface-2)]"><p className="text-sm text-[color:var(--color-brand)]">{streamError ?? "Could not load"}</p></div>;
  return <PlayerClient src={stream.url} title={title} poster={null} movieId={movieId} movie={movie} />;
}

function Gate({ label, to }: { label: string; to?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-black text-white">
      <div className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-6 text-center">
        <p className="font-semibold">{label}</p>
        {to && (
          <a className="mt-2 inline-block rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-medium" href={to}>
            Continue
          </a>
        )}
      </div>
    </div>
  );
}

export type { PresenceUser };
