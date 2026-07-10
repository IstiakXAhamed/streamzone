/**
 * lib/ui/preferences.ts
 * Saved-view preference read/write round-trip (grid/list) via a pluggable
 * storage interface so it's testable without a real localStorage.
 * (Req 10.1)
 */

export type SavedView = "grid" | "list";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SAVED_VIEW_KEY = "mz:saved-view";

/** In-memory storage fallback, also usable directly by tests. */
export function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
}

export function writeSavedView(storage: KeyValueStorage, view: SavedView): void {
  storage.setItem(SAVED_VIEW_KEY, view);
}

export function readSavedView(storage: KeyValueStorage, fallback: SavedView = "grid"): SavedView {
  const value = storage.getItem(SAVED_VIEW_KEY);
  return value === "grid" || value === "list" ? value : fallback;
}
