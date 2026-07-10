/**
 * lib/ui/avatars.ts
 * visibleAvatars(participants) — <=8 visible + exact overflow count.
 * (Req 8.3)
 */

export interface AvatarVisibility<T> {
  visible: T[];
  overflowCount: number;
  showOverflow: boolean;
}

const MAX_VISIBLE_AVATARS = 8;

export function visibleAvatars<T>(participants: T[]): AvatarVisibility<T> {
  const visible = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = Math.max(0, participants.length - MAX_VISIBLE_AVATARS);
  return { visible, overflowCount, showOverflow: overflowCount > 0 };
}
