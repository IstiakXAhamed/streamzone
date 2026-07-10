/**
 * lib/ui/optimistic.ts
 * applyOptimistic/confirm/revert — revert restores exact prior state and
 * is idempotent. (Req 17.2)
 */

export interface OptimisticEntry<T> {
  previous: T;
  applied: T;
  confirmed: boolean;
}

export function applyOptimistic<T>(previous: T, next: T): OptimisticEntry<T> {
  return { previous, applied: next, confirmed: false };
}

export function confirm<T>(entry: OptimisticEntry<T>): OptimisticEntry<T> {
  return { ...entry, confirmed: true };
}

/** Revert to the prior state. Idempotent: reverting an already-reverted entry is a no-op change. */
export function revert<T>(entry: OptimisticEntry<T>): OptimisticEntry<T> {
  return { previous: entry.previous, applied: entry.previous, confirmed: false };
}

export function currentValue<T>(entry: OptimisticEntry<T>): T {
  return entry.applied;
}
