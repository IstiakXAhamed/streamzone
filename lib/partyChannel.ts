import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type PresenceUser = { userId: string; name?: string; presenceRef: string; joinedAt?: number };
type PresenceState = Record<string, PresenceUser[]>;

export type PartyMessage = {
  kind: "control" | "time" | "chat" | "voice-sdp" | "voice-ice";
  action?: "play" | "pause" | "seek";
  t?: number;
  playing?: boolean;
  text?: string;
  by: string;
  name?: string;
  target?: string;
  sdp?: unknown;
  candidate?: unknown;
  at: number;
};

export interface PartyPresence {
  presenceRef: string;
  userId: string;
  name?: string;
  joinedAt: number;
}

const channelName = (roomId: string) => `party:${roomId}`;

/**
 * Subscribe to a party's realtime channel. Returns a small handle that exposes
 * broadcast/presence/onMessage helpers. Caller is responsible for cleanup.
 */
export function joinPartyChannel(roomId: string, identity: { id: string; name?: string }) {
  const sb = createClient();
  const channel: RealtimeChannel = sb.channel(channelName(roomId), {
    config: {
      broadcast: { ack: false, self: false },
      presence: { key: identity.id },
    },
  });

  const handlers: ((m: PartyMessage) => void)[] = [];

  channel
    .on("broadcast", { event: "msg" }, ({ payload }) => {
      const msg = payload as PartyMessage;
      handlers.forEach((h) => h(msg));
    })
    .on("presence", { event: "sync" }, () => {
      // presence handled separately via subscribe state
    });

  let unsubscribed = false;
  return {
    async subscribe(): Promise<PresenceState> {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("subscribe timeout")), 12_000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            channel.track({
              userId: identity.id,
              name: identity.name ?? identity.id,
              joinedAt: Date.now(),
            } as PresenceUser).then(() => resolve(channel.presenceState() as unknown as PresenceState)).catch(reject);
          }
        });
      });
    },
    send(msg: Omit<PartyMessage, "at">) {
      const withAt = { ...msg, at: Date.now() } as PartyMessage;
      channel.send({ type: "broadcast", event: "msg", payload: withAt }).catch(() => undefined);
      return withAt;
    },
    presence(): PresenceState {
      return channel.presenceState() as unknown as PresenceState;
    },
    onMessage(handler: (m: PartyMessage) => void): () => void {
      handlers.push(handler);
      return () => {
        const i = handlers.indexOf(handler);
        if (i >= 0) handlers.splice(i, 1);
      };
    },
    leave() {
      if (unsubscribed) return;
      unsubscribed = true;
      channel.untrack().finally(() => sb.removeChannel(channel));
    },
  };
}

export type PartyHandle = ReturnType<typeof joinPartyChannel>;
