"use client";

/**
 * app/(site)/saved/_components/SavedMoviesContent.tsx
 * Rebuild: grid/list toggle persisted via lib/ui/preferences.ts; item
 * fields with graceful omission; remove exit (fade+scale) + collapse;
 * empty state (CTA to Home); staggered entry capped 20; batch select via
 * lib/ui/selection.ts + confirm; 50/page pagination via lib/ui/pagination.ts
 * ordered by saved desc.
 * (Req 10.1-10.7, 19.1)
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Grid3x3, List, Trash2, Bookmark } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Media } from "@/components/ui/Media";
import { readSavedView, writeSavedView, createMemoryStorage, type SavedView, type KeyValueStorage } from "@/lib/ui/preferences";
import { toggleSelection, removeSelected } from "@/lib/ui/selection";
import { paginate } from "@/lib/ui/pagination";
import { staggerDelays } from "@/lib/ui/layout-math";
import { relativeTime, toSavedItemMetadata } from "@/lib/ui/format";
import { listSavedOffline, getSavedBlobUrl, removeSavedOffline } from "@/lib/sw-offline";

interface Item {
  id: string;
  savedAt: string;
  posterUrl: string | null;
  title?: string;
  year?: number | null;
  rating?: number | null;
  genres?: string[] | null;
}

const STAGGER_STEP_MS = 40;
const STAGGER_CAP = 20;
const PAGE_SIZE = 50;

function browserStorage(): KeyValueStorage {
  if (typeof window === "undefined") return createMemoryStorage();
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  };
}

export function SavedMoviesContent({
  initialSaved,
  titleById,
}: {
  initialSaved: Item[];
  titleById: Map<string, { title?: string } | undefined>;
}) {
  const [items, setItems] = useState(initialSaved);
  const [view, setView] = useState<SavedView>("grid");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  useEffect(() => {
    setView(readSavedView(browserStorage()));
  }, []);

  useEffect(() => {
    listSavedOffline()
      .then((s) => setItems(s as unknown as Item[]))
      .catch(() => undefined);
  }, []);

  function changeView(next: SavedView) {
    setView(next);
    writeSavedView(browserStorage(), next);
  }

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
    [items],
  );
  const pages = useMemo(() => paginate(sortedItems, PAGE_SIZE), [sortedItems]);
  const currentPageItems = pages[page] ?? [];
  const delays = staggerDelays(currentPageItems.length, STAGGER_STEP_MS, STAGGER_CAP);

  async function removeOne(id: string) {
    await removeSavedOffline(id);
    setItems((l) => l.filter((s) => s.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function removeBatch() {
    if (selected.size === 0) return;
    if (!confirm(`Remove ${selected.size} saved item${selected.size === 1 ? "" : "s"}?`)) return;
    for (const id of selected) {
      await removeSavedOffline(id);
    }
    setItems((prev) => removeSelected(prev, selected, (item) => item.id));
    setSelected(new Set());
    setSelectMode(false);
  }

  async function play(id: string) {
    const url = await getSavedBlobUrl(id);
    if (!url) {
      alert("Please save the movie again — its data was cleared.");
      return;
    }
    const tab = window.open("", "_blank");
    if (tab) {
      tab.document.write(
        `<!doctype html><html><body style="margin:0;background:#000"><video src="${url}" autoplay controls style="width:100vw;height:100vh"></video></body></html>`,
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading">Saved</h1>
        <div className="flex items-center gap-2">
          {items.length > 0 ? (
            <button
              onClick={() => {
                setSelectMode((v) => !v);
                setSelected(new Set());
              }}
              className="rounded-full bg-[color:var(--color-surface-3)] px-3 py-1.5 text-sm font-medium hover:bg-[color:var(--color-surface-4)]"
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          ) : null}
          <div className="flex overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
            <button
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => changeView("grid")}
              className={["grid h-9 w-9 place-items-center", view === "grid" ? "bg-[color:var(--color-brand)] text-white" : "text-[color:var(--color-text-secondary)]"].join(" ")}
            >
              <Grid3x3 aria-hidden="true" size={16} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => changeView("list")}
              className={["grid h-9 w-9 place-items-center", view === "list" ? "bg-[color:var(--color-brand)] text-white" : "text-[color:var(--color-text-secondary)]"].join(" ")}
            >
              <List aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectMode && selected.size > 0 ? (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-[color:var(--color-surface-2)] px-4 py-3">
          <span className="text-sm">{selected.size} selected</span>
          <button
            onClick={removeBatch}
            className="flex items-center gap-1.5 rounded-full bg-[color:var(--color-error)] px-3 py-1.5 text-sm font-medium text-white"
          >
            <Trash2 aria-hidden="true" size={14} /> Remove
          </button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          illustration={<Bookmark aria-hidden="true" className="h-10 w-10" />}
          title="Nothing saved yet"
          body="Open a movie and tap Save to keep it here for quick access."
          cta={{ label: "Browse Movies", href: "/" }}
        />
      ) : (
        <>
          <ul className={view === "grid" ? "grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6" : "space-y-2"}>
            <AnimatePresence>
              {currentPageItems.map((item, i) => {
                const meta = toSavedItemMetadata(item);
                const title = item.title ?? titleById.get(item.id)?.title ?? item.id;
                const isSelected = selected.has(item.id);
                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ delay: delays[i] / 1000, duration: 0.3, ease: [0, 0, 0.2, 1] }}
                    className={view === "grid" ? "flex flex-col gap-1" : "flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-2"}
                  >
                    {selectMode ? (
                      <input
                        type="checkbox"
                        aria-label={`Select ${title}`}
                        checked={isSelected}
                        onChange={() => setSelected((prev) => toggleSelection(prev, item.id))}
                        className="h-4 w-4 shrink-0"
                      />
                    ) : null}
                    <div className={view === "grid" ? "relative aspect-[2/3] w-full overflow-hidden rounded-xl" : "relative h-16 w-12 shrink-0 overflow-hidden rounded-md"}>
                      <Media src={item.posterUrl} alt={title} fill sizes="120px" />
                    </div>
                    <div className={view === "grid" ? "" : "min-w-0 flex-1"}>
                      <p className="line-clamp-1 text-sm">{title}</p>
                      <p className="flex flex-wrap gap-1 text-xs text-[color:var(--color-text-tertiary)]">
                        {meta.year != null ? <span>{meta.year}</span> : null}
                        {meta.rating != null ? <span>· {meta.rating.toFixed(1)}★</span> : null}
                        <span>· {relativeTime(item.savedAt)}</span>
                      </p>
                    </div>
                    {!selectMode ? (
                      <span className="flex gap-1">
                        <button onClick={() => play(item.id)} className="rounded-full bg-[color:var(--color-brand)] px-2 py-1 text-xs text-white">
                          Play
                        </button>
                        <button
                          onClick={() => removeOne(item.id)}
                          aria-label={`Remove ${title}`}
                          className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-1 text-xs"
                        >
                          ✕
                        </button>
                      </span>
                    ) : null}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {pages.length > 1 ? (
            <div className="mt-6 flex justify-center gap-2">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-current={i === page ? "page" : undefined}
                  className={["h-8 w-8 rounded-full text-sm", i === page ? "bg-[color:var(--color-brand)] text-white" : "bg-[color:var(--color-surface-3)]"].join(" ")}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
