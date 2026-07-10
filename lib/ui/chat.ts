/**
 * lib/ui/chat.ts
 * isValidMessage/clampMessage (1-500 trimmed chars) and applyIncoming
 * auto-scroll/unread reducer keyed on bottom-anchored scroll state.
 * (Req 8.2, 8.7)
 */

export const MAX_MESSAGE_LENGTH = 500;

export function isValidMessage(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_MESSAGE_LENGTH;
}

/** Clamp a message to the max length after trimming (does not pad short messages). */
export function clampMessage(text: string): string {
  return text.trim().slice(0, MAX_MESSAGE_LENGTH);
}

export interface ChatScrollState {
  isAtBottom: boolean;
  unreadCount: number;
}

/**
 * Reducer for an incoming chat message: if the user is at the bottom,
 * auto-scroll happens (represented by isAtBottom staying true, unread
 * count stays 0). If scrolled up, unread count increments and no
 * auto-scroll occurs.
 */
export function applyIncoming(state: ChatScrollState): ChatScrollState {
  if (state.isAtBottom) {
    return { isAtBottom: true, unreadCount: 0 };
  }
  return { isAtBottom: false, unreadCount: state.unreadCount + 1 };
}

/** Mark the chat as scrolled to the bottom, clearing unread count. */
export function markAtBottom(state: ChatScrollState): ChatScrollState {
  return { isAtBottom: true, unreadCount: 0 };
}

/** Mark the chat as scrolled away from the bottom. */
export function markScrolledUp(state: ChatScrollState): ChatScrollState {
  return { ...state, isAtBottom: false };
}
