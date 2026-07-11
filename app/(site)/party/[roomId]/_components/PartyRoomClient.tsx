"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlayerClient } from "@/components/player/PlayerClient";
import { joinPartyChannel, type PartyHandle, type PartyMessage, type PresenceUser } from "@/lib/partyChannel";
import { ChatPanel, type ChatMessage } from "./ChatPanel";
import { ParticipantStrip } from "./ParticipantStrip";
import { LiveVoice } from "@/components/party/LiveVoice";
import { Copy, Maximize2, MessageCircle, Minimize2, UserPlus, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";

export function PartyRoomClient({
  roomId, mediaId, streamUrl, initialMovieTitle, poster, hostUserId,
  identityId, identityName, identityStatus,
}: {
  roomId: string; mediaId: string; streamUrl: string; initialMovieTitle: string;
  poster: string | null;
  hostUserId: string; identityId: string | null; identityName: string;
  identityStatus: string | null;
}) {
  const isHost = identityId === hostUserId;
  const { push } = useToast();

  const [participants, setParticipants] = useState<PresenceUser[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [lastVoiceMessage, setLastVoiceMessage] = useState<PartyMessage | null>(null);
  const [syncCommand, setSyncCommand] = useState<PartyMessage | null>(null);
  const [confirmedControl, setConfirmedControl] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  // Maximized (theater) mode: app-level fullscreen that keeps chat/call
  // accessible (native video fullscreen would clip them, esp. on iOS).
  const [maximized, setMaximized] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [chatOpenMax, setChatOpenMax] = useState(false);
  const overlayHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const partyRef = useRef<PartyHandle | null>(null);
  const sendRef = useRef<((msg: Omit<PartyMessage, "at">) => PartyMessage) | null>(null);
  // Track the last host action so we don't toast on every 2s heartbeat sync.
  const lastControlActionRef = useRef<string | null>(null);
  // Track the last broadcast action so the host's "Broadcast" badge doesn't
  // flash every 2s on the periodic heartbeat.
  const lastBroadcastActionRef = useRef<string | null>(null);

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
        // Apply host's control commands to our player (silent — runs every 2s)
        setSyncCommand(msg);
        // Only toast on an ACTUAL play/pause transition, not the periodic
        // heartbeat sync, otherwise a popup appears every couple seconds.
        if (!isHost && (msg.action === "play" || msg.action === "pause") && msg.action !== lastControlActionRef.current) {
          push({ kind: "info", message: `Host ${msg.action === "play" ? "resumed" : "paused"} playback` });
        }
        if (msg.action) lastControlActionRef.current = msg.action;
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
    // Only flash the badge on an actual change, not the 2s heartbeat.
    if (action !== lastBroadcastActionRef.current) {
      setConfirmedControl(action);
      setTimeout(() => setConfirmedControl(null), 2000);
      lastBroadcastActionRef.current = action;
    }
  }, [isHost, identityId]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    push({ kind: "success", message: "Party link copied — share it with friends!" });
  }

  function scheduleOverlayHide() {
    if (overlayHideTimer.current) clearTimeout(overlayHideTimer.current);
    overlayHideTimer.current = setTimeout(() => setOverlayVisible(false), 4000);
  }

  function toggleMaximize() {
    setMaximized((m) => {
      const next = !m;
      if (next) {
        setOverlayVisible(true);
        scheduleOverlayHide();
      } else {
        setChatOpenMax(false);
      }
      return next;
    });
  }

  // Tapping the video in maximized mode reveals/hides the chat & call overlay.
  function handlePlayerTap() {
    if (!maximized) return;
    setOverlayVisible((v) => {
      const next = !v;
      if (next) scheduleOverlayHide();
      return next;
    });
  }

  useEffect(() => {
    return () => {
      if (overlayHideTimer.current) clearTimeout(overlayHideTimer.current);
    };
  }, []);

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
          {/* Player wrapper — becomes an app-level fullscreen layer when maximized.
              LiveVoice stays inside this wrapper in both modes so the call is
              never remounted (which would drop it). */}
          <div className={maximized ? "fixed inset-0 z-[70] flex flex-col bg-black" : "relative"}>
            <div className={maximized ? "relative min-h-0 flex-1" : "relative"} onClick={handlePlayerTap}>
              {streamUrl ? (
                <PlayerClient
                  src={streamUrl}
                  title={initialMovieTitle}
                  poster={poster}
                  movieId={mediaId}
                  movie={{ slug: "party", id: mediaId }}
                  isHost={isHost}
                  onControl={handleControl}
                  syncCommand={syncCommand}
                  fill={maximized}
                />
              ) : (
                <div className="grid aspect-video place-items-center rounded-xl bg-[color:var(--color-surface-2)]">
                  <p className="text-sm text-[color:var(--color-brand)]">Could not load stream</p>
                </div>
              )}

              {/* Maximize / minimize — gives guests (no native controls) a way to go fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
                aria-label={maximized ? "Exit fullscreen" : "Maximize"}
                className="absolute right-2 top-2 z-40 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm"
              >
                {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Tap-to-reveal overlay while maximized */}
              {maximized && overlayVisible ? (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent p-3 pr-14">
                    <span className="truncate text-sm font-medium text-white">{initialMovieTitle}</span>
                    <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs text-white">{isHost ? "Host" : "Guest"}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setChatOpenMax((o) => !o); }}
                      className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      <MessageCircle size={14} /> Chat
                    </button>
                  </div>
                </>
              ) : null}

              {/* Chat panel overlay inside the maximized view */}
              {maximized && chatOpenMax ? (
                <div
                  className="absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col bg-[color:var(--color-surface-1)] shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-[color:var(--color-border-subtle)] p-3">
                    <span className="text-sm font-semibold text-white">Chat</span>
                    <button onClick={() => setChatOpenMax(false)} aria-label="Close chat" className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface-3)] text-white">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <ChatPanel chat={chat} onSend={handleChat} />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Voice call — same DOM position in both modes (never remounts). In
                maximized mode it floats above the video while the overlay is shown. */}
            <div
              className={
                maximized
                  ? `absolute inset-x-0 bottom-14 z-30 px-3 ${overlayVisible ? "" : "hidden"}`
                  : "mt-3"
              }
              onClick={(e) => e.stopPropagation()}
            >
              <LiveVoice roomId={roomId} />
            </div>
          </div>

          {!maximized ? <ParticipantStrip participants={participantList} /> : null}
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
