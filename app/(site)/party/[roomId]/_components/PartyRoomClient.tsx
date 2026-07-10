"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlayerClient } from "@/components/player/PlayerClient";
import { useStreamUrl } from "@/hooks/useStreamUrl";
import { joinPartyChannel, type PartyHandle, type PartyMessage, type PresenceUser } from "@/lib/partyChannel";
import { ChatPanel, type ChatMessage } from "./ChatPanel";
import { ParticipantStrip } from "./ParticipantStrip";
import { LiveVoice } from "@/components/party/LiveVoice";
import { Copy, MessageCircle, UserPlus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";

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
  const { push } = useToast();

  const [participants, setParticipants] = useState<PresenceUser[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [lastVoiceMessage, setLastVoiceMessage] = useState<PartyMessage | null>(null);
  const [syncCommand, setSyncCommand] = useState<PartyMessage | null>(null);
  const [confirmedControl, setConfirmedControl] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

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
      if (msg.kind === "control" && msg.by !== identityId) {
        // Apply host's control commands to our player
        setSyncCommand(msg);
        if (!isHost && msg.action) {
          push({ kind: "info", message: `Host ${msg.action === "play" ? "resumed" : msg.action === "pause" ? "paused" : "seeked"} playback` });
        }
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
  }, [identityId, identityStatus, roomId, identityName, isHost, push]);

  const handleChat = useCallback((text: string) => {
    if (!identityId) return;
    partyRef.current?.send({ kind: "chat", text, by: identityId, name: identityName } as Omit<PartyMessage, "at">);
    setChat((c) => [...c, { by: identityId, name: identityName, text, at: Date.now() }]);
  }, [identityId, identityName]);

  // Host broadcasts control commands so guests sync
  const handleControl = useCallback((action: "play" | "pause" | "seek", time?: number) => {
    if (!isHost || !identityId) return;
    partyRef.current?.send({
      kind: "control",
      action,
      t: time,
      by: identityId,
    } as Omit<PartyMessage, "at">);
    setConfirmedControl(action);
    setTimeout(() => setConfirmedControl(null), 2000);
  }, [isHost, identityId]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    push({ kind: "success", message: "Party link copied — share it with friends!" });
  }

  if (identityStatus === "pending") return <Gate label="Awaiting approval" />;
  if (identityStatus === "suspended") return <Gate label="Suspended" />;
  if (!identityId) return <Gate label="Sign in to join" to="/login" />;

  const participantList = participants.map((p) => ({ id: p.userId, name: p.name ?? p.userId, isHost: p.userId === hostUserId }));

  return (
    <main className="mx-auto flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center gap-3 border-b border-[color:var(--color-border-subtle)] px-4 py-3">
        <span className="text-sm font-bold text-[color:var(--color-brand)]">Party</span>
        <span className="truncate text-sm">{initialMovieTitle}</span>
        <span className="rounded-full bg-[color:var(--color-brand)]/20 px-2 py-0.5 text-xs text-[color:var(--color-brand)]">
          {isHost ? "Host" : "Guest"}
        </span>
        {confirmedControl ? (
          <span className="rounded-full bg-[color:var(--color-success)]/20 px-2 py-0.5 text-xs text-[color:var(--color-success)]">
            Broadcast: {confirmedControl}
          </span>
        ) : null}
        <button onClick={copyLink} className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface-3)]" title="Copy invite link">
          <Copy aria-hidden="true" size={14} />
        </button>
        {isHost && <InviteFriendsButton roomId={roomId} />}
        <button
          onClick={() => setMobileChatOpen(true)}
          aria-label="Open chat"
          className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface-3)] lg:hidden"
        >
          <MessageCircle aria-hidden="true" size={14} />
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
            isHost={isHost}
            onControl={handleControl}
            syncCommand={syncCommand}
          />
          <LiveVoice roomId={roomId} />
          <ParticipantStrip participants={participantList} />
        </div>
        <aside className="hidden flex-col gap-3 lg:flex">
          <ChatPanel chat={chat} onSend={handleChat} />
        </aside>
      </div>

      <Sheet open={mobileChatOpen} onClose={() => setMobileChatOpen(false)} labelledBy="party-chat-sheet-title" heightVh={50}>
        <h2 id="party-chat-sheet-title" className="sr-only">
          Party chat
        </h2>
        <ChatPanel chat={chat} onSend={handleChat} />
      </Sheet>
    </main>
  );
}

function PlayerBlock({
  title, stream, streamError, isLoading, movieId, movie, isHost, onControl, syncCommand,
}: {
  title: string;
  stream: { url: string; id: string; title: string } | undefined;
  streamError: string | null;
  isLoading: boolean;
  movieId: string;
  movie: { slug: string; id: string };
  isHost: boolean;
  onControl?: (action: "play" | "pause" | "seek", time?: number) => void;
  syncCommand?: { action?: string; t?: number } | null;
}) {
  if (isLoading) return <div className="grid aspect-video place-items-center rounded-xl bg-[color:var(--color-surface-2)]"><p className="text-sm">Preparing stream…</p></div>;
  if (streamError || !stream) return <div className="grid aspect-video place-items-center rounded-xl bg-[color:var(--color-surface-2)]"><p className="text-sm text-[color:var(--color-brand)]">{streamError ?? "Could not load"}</p></div>;
  return <PlayerClient src={stream.url} title={title} poster={null} movieId={movieId} movie={movie} isHost={isHost} onControl={onControl} syncCommand={syncCommand} />;
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

function InviteFriendsButton({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<{ id: string; user: { id: string; name: string | null; email: string } }[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    fetch("/api/friends").then(r => r.json()).then(data => {
      setFriends(data.friends ?? []);
    }).catch(() => {});
  }, [open]);

  async function invite(friendUserId: string) {
    setInviting(friendUserId);
    const res = await fetch("/api/party/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId, friendUserId }),
    });
    if (res.ok) {
      setInvited(prev => new Set([...prev, friendUserId]));
    }
    setInviting(null);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface-3)]" title="Invite friends">
        <UserPlus size={14} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5">
            <h3 className="mb-3 text-lg font-bold">Invite friends to party</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-tertiary)]">No friends yet. Add friends from the Friends page first.</p>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto">
                {friends.map(f => (
                  <li key={f.id} className="flex items-center justify-between rounded-lg bg-[color:var(--color-surface-2)] px-3 py-2">
                    <span className="text-sm">{f.user?.name ?? f.user?.email}</span>
                    {invited.has(f.user?.id) ? (
                      <span className="text-xs text-emerald-400">Invited ✓</span>
                    ) : (
                      <button
                        onClick={() => invite(f.user?.id)}
                        disabled={inviting === f.user?.id}
                        className="rounded-full bg-[color:var(--color-brand)] px-2 py-0.5 text-xs text-white disabled:opacity-50"
                      >
                        {inviting === f.user?.id ? "..." : "Invite"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setOpen(false)} className="mt-3 w-full rounded-full bg-[color:var(--color-surface-3)] py-2 text-sm">Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export type { PresenceUser };
