"use client";

import { useCallback, useEffect, useState } from "react";
import { listSavedOffline, getSavedBlobUrl, removeSavedOffline } from "@/lib/sw-offline";

interface Item { id: string; savedAt: string; posterUrl: string | null; }

export function SavedMoviesContent(
  { initialSaved, titleById }: { initialSaved: Item[]; titleById: Map<string, { title?: string } | undefined> }
) {
  const [items, setItems] = useState(initialSaved);
  useEffect(() => {
    listSavedOffline()
      .then((s) => setItems(s as unknown as Item[]))
      .catch(() => undefined);
  }, []);

  const play = useCallback(async (id: string) => {
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
  }, []);

  const remove = useCallback(async (id: string) => {
    if (!confirm("Remove this offline movie?")) return;
    await removeSavedOffline(id);
    setItems((l) => l.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Saved offline</h1>
      {items.length === 0 ? (
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          Nothing saved yet. Open a movie and click <strong>+ Save</strong> to keep it for offline viewing.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((s) => (
            <li key={s.id} className="flex flex-col gap-1">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]">
                {s.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.posterUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <p className="line-clamp-1 text-xs">{titleById.get(s.id)?.title ?? s.id}</p>
              <span className="flex gap-1">
                <button onClick={() => play(s.id)} className="flex-1 rounded-full bg-[color:var(--color-brand)] py-1 text-xs">Play</button>
                <button onClick={() => remove(s.id)} className="rounded-full bg-[color:var(--color-surface-3)] px-2 text-xs">✕</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
