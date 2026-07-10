/**
 * lib/ui/presence.ts
 * isOnline(lastSeen, now) — 5-minute boundary treated as online.
 * (Req 9.3)
 */

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(lastSeen: Date | string | number, now: Date | string | number = Date.now()): boolean {
  const lastSeenMs = new Date(lastSeen).getTime();
  const nowMs = new Date(now).getTime();
  return nowMs - lastSeenMs <= ONLINE_WINDOW_MS;
}
