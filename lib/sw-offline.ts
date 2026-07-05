/**
 * Offline-movie helpers. Talks to the Service Worker over postMessage and to
 * `/api/offline/*` for metadata persistence.
 *
 * Movie mp4 blobs live in browser IndexedDB *and* get cached by the SW under
 * `/__movie__/<id>` which plays offline-HTML when the user has no network.
 */

export interface SavedMovie {
  id: string;
  title: string;
  savedAt: number;
  sizeBytes?: number;
  posterUrl?: string | null;
}

export async function saveMovieOffline(input: {
  id: string; title: string; streamUrl: string;
}): Promise<{ ok: boolean; sizeBytes?: number; error?: string }> {
  try {
    const res = await fetch(input.streamUrl, { mode: "cors" });
    if (!res.ok) return { ok: false, error: `fetch failed: ${res.status}` };
    const blob = await res.blob();

    // stash in a volatile BlobStore IDB database
    await writeBlob(input.id, blob);

    // notify the SW about the movie item for PlayerContent fetch-caching
    navigator.serviceWorker?.controller?.postMessage?.({
      type: "moviezone:cache-movie",
      movieId: input.id,
    });

    // persist metadata server-side
    await fetch("/api/offline/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ movieId: input.id, title: input.title, sizeBytes: blob.size }),
    });

    return { ok: true, sizeBytes: blob.size };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function listSavedOffline(): Promise<SavedMovie[]> {
  const res = await fetch("/api/offline/list");
  if (!res.ok) return [];
  return ((await res.json()) as { saved: SavedMovie[] }).saved ?? [];
}

export async function removeSavedOffline(id: string) {
  await deleteBlob(id);
  await fetch("/api/offline/remove", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ movieId: id }),
  });
}

export async function getSavedBlobUrl(id: string): Promise<string | null> {
  const blob = await readBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

// ---------- tiny IDB wrapper ----------
const DB = "moviezone-offline";
const STORE = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeBlob(id: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteBlob(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
