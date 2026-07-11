"use client";

import { useCallback, useRef, useState } from "react";

export interface DriveUploadResult {
  id: string;
  name: string;
  size: number | null;
  mimeType: string;
  thumbnailLink: string | null;
}

// Direct-to-Google chunk size. Bytes go browser → Google Drive directly, so
// we're NOT bound by Vercel's 4.5MB serverless body limit. Bigger chunks =
// far fewer round trips = much faster uploads. Must be a multiple of 256KB
// (Google's requirement for resumable uploads).
const DIRECT_CHUNK_SIZE = 256 * 1024 * 64; // 16,777,216 bytes = 16MB

// Fallback chunk size for the Vercel proxy path (must stay < 4.5MB body limit).
const PROXY_CHUNK_SIZE = 256 * 1024 * 14; // 3,670,016 bytes = 3.5MB

const MAX_RETRIES = 3;

/**
 * Uploads a file to Google Drive via chunked resumable upload.
 *
 * Fast path (default): the browser PUTs chunks DIRECTLY to Google's resumable
 * session URI. Vercel only creates the session. This avoids the double network
 * hop (browser → Vercel → Google) and Vercel's request size / duration limits.
 *
 * Fallback path: if the direct cross-origin PUT is blocked (rare — some
 * corporate proxies / browser configs), we retry the same session through our
 * server proxy route (/api/drive/upload-chunk), which stays under Vercel's
 * 4.5MB body limit.
 */
export function useDriveUpload() {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const startUpload = useCallback(
    async (file: File, onProgress?: (pct: number) => void): Promise<DriveUploadResult> => {
      setBusy(true);
      setError(null);
      setProgress(0);
      abortRef.current = false;
      onProgress?.(0);

      try {
        // 1. Create a resumable upload session
        const startRes = await fetch("/api/drive/upload-start", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            fileSize: file.size,
          }),
        });

        if (!startRes.ok) {
          const data = await startRes.json().catch(() => ({})) as { error?: string };
          const msg = data.error ?? `Upload start failed: ${startRes.status}`;
          setError(msg);
          throw new Error(msg);
        }

        const { sessionId, uploadUrl } = await startRes.json() as {
          sessionId: string;
          uploadUrl?: string;
        };

        const totalSize = file.size;
        let fileId = "";

        // Try the fast direct-to-Google path first.
        let useDirect = Boolean(uploadUrl);

        // 2. Upload in chunks (sequential — required by resumable protocol)
        let offset = 0;

        while (offset < totalSize) {
          if (abortRef.current) throw new Error("Upload cancelled");

          // Recompute per iteration: if we fall back to the proxy mid-file,
          // the chunk size must shrink to stay under Vercel's 4.5MB body limit.
          const chunkSize = useDirect ? DIRECT_CHUNK_SIZE : PROXY_CHUNK_SIZE;
          const end = Math.min(offset + chunkSize, totalSize) - 1;
          const chunk = file.slice(offset, end + 1);

          let done = false;
          let returnedFileId = "";

          if (useDirect && uploadUrl) {
            const result = await uploadChunkDirect(uploadUrl, chunk, offset, end, totalSize);
            if (result.corsBlocked) {
              // Direct path is blocked — fall back to the Vercel proxy for the
              // REST of the file. Re-slice at proxy chunk size from this offset.
              useDirect = false;
              continue;
            }
            done = result.done;
            returnedFileId = result.fileId;
          } else {
            const result = await uploadChunkProxy(sessionId, chunk, offset, end, totalSize);
            done = result.done;
            returnedFileId = result.fileId;
          }

          if (done) fileId = returnedFileId;

          offset = end + 1;
          const pct = Math.round((offset / totalSize) * 100);
          setProgress(pct);
          onProgress?.(pct);
        }

        setProgress(100);
        onProgress?.(100);
        setBusy(false);

        return {
          id: fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          thumbnailLink: null,
        };
      } catch (e) {
        setBusy(false);
        const msg = (e as Error).message;
        setError((prev) => prev ?? msg);
        throw e;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
    setBusy(false);
  }, []);

  return { startUpload, cancel, progress, busy, error };
}

// ─── Direct-to-Google chunk upload ───────────────────────────────────────────

async function uploadChunkDirect(
  uploadUrl: string,
  chunk: Blob,
  start: number,
  end: number,
  total: number,
): Promise<{ done: boolean; fileId: string; corsBlocked?: boolean }> {
  const contentRange = `bytes ${start}-${end}/${total}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Range": contentRange },
        body: chunk,
        // No credentials — the session URI is self-authenticating.
      });

      // 308 = Resume Incomplete (more chunks expected)
      if (res.status === 308) return { done: false, fileId: "" };

      // 200/201 = complete
      if (res.ok) {
        const data = await res.json().catch(() => ({})) as { id?: string };
        return { done: true, fileId: data.id ?? "" };
      }

      // 5xx — retry with backoff
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await delay(1000 * attempt);
        continue;
      }

      // 4xx (non-retryable, e.g. session expired)
      throw new Error(`Direct upload failed: ${res.status}`);
    } catch (e) {
      // A CORS block or network failure surfaces as a TypeError ("Failed to
      // fetch"). Signal the caller to fall back to the proxy path.
      if (e instanceof TypeError) {
        return { done: false, fileId: "", corsBlocked: true };
      }
      if (attempt >= MAX_RETRIES) throw e;
      await delay(1000 * attempt);
    }
  }

  return { done: false, fileId: "", corsBlocked: true };
}

// ─── Vercel proxy chunk upload (fallback) ────────────────────────────────────

async function uploadChunkProxy(
  sessionId: string,
  chunk: Blob,
  start: number,
  end: number,
  total: number,
): Promise<{ done: boolean; fileId: string }> {
  const params = new URLSearchParams({
    sid: sessionId,
    start: String(start),
    end: String(end),
    total: String(total),
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`/api/drive/upload-chunk?${params.toString()}`, {
        method: "PUT",
        credentials: "same-origin",
        body: chunk,
      });

      if (res.ok) {
        const data = await res.json() as { done: boolean; fileId?: string };
        return { done: data.done, fileId: data.fileId ?? "" };
      }

      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await delay(1000 * attempt);
        continue;
      }

      const data = await res.json().catch(() => ({})) as { error?: string; details?: string };
      const msg = [data.error, data.details].filter(Boolean).join(" — ") || `Chunk upload failed: ${res.status}`;
      throw new Error(msg);
    } catch (e) {
      if (attempt >= MAX_RETRIES) throw e;
      await delay(1000 * attempt);
    }
  }

  throw new Error("Chunk upload failed after retries");
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
