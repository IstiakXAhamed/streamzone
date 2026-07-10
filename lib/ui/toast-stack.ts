/**
 * lib/ui/toast-stack.ts
 * Reducer capping visible toasts at 3, evicting oldest on a 4th; dismiss
 * removes only the target. (Req 19.5)
 */

export interface Toast {
  id: string;
  kind: "info" | "success" | "error";
  message: string;
  createdAt: number;
}

export const MAX_VISIBLE_TOASTS = 3;

/** Push a new toast onto the stack, evicting the oldest if it would exceed the cap. */
export function pushToast(stack: Toast[], toast: Toast): Toast[] {
  const next = [...stack, toast];
  if (next.length > MAX_VISIBLE_TOASTS) {
    return next.slice(next.length - MAX_VISIBLE_TOASTS);
  }
  return next;
}

/** Dismiss a toast by id; removes only the targeted toast. */
export function dismissToast(stack: Toast[], id: string): Toast[] {
  return stack.filter((t) => t.id !== id);
}
