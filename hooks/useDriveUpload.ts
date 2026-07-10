"use client";

import { useCallback, useRef, useState } from "react";

export interface DriveUploadResult {
  id: string;
  name: string;
  size: number | null;
  mimeType: string;
  thumbnailLink: string | null;
}

// 5MB chunks — larger chunks = fewer round trips = faster uploads.
// Safely under Vercel's request body limit on Pro plans (up to 50MB).
// Must be a multiple of 256KB (Google's requirement for resumable uploads).
const CHUNK_SIZE = 256 * 1024 * 20; // 5,242,880 bytes = 5MB

/**
 * Uploads a file to Google Drive via chunked resumable upload through our server.
 * Flow: browser → /api/drive/upload-chunk → Google Drive
 * Supports files of any size. Chunks are sent sequentially (required by
 * Google's resumable upload protocol) but with optimized chunk sizes to
 * minimize round-trip overhead.
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

        const { sessionId } = await startRes.json() as { sessionId: string };

        // 2. Upload in chunks (sequential, required by resumable protocol)
        let offset = 0;
        let fileId = "";
        const totalSize = file.size;

        while (offset < totalSize) {
          if (abortRef.current) {
            throw new Error("Upload cancelled");
          }

          const end = Math.min(offset + CHUNK_SIZE, totalSize) - 1;
          const chunk = file.slice(offset, end + 1);

          const params = new URLSearchParams({
            sid: sessionId,
            start: String(offset),
            end: String(end),
            total: String(totalSize),
          });

          // Retry logic for transient failures (network blips during large uploads)
          let chunkRes: Response | null = null;
          let attempts = 0;
          const MAX_RETRIES = 3;

          while (attempts < MAX_RETRIES) {
            attempts++;
            try {
              chunkRes = await fetch(`/api/drive/upload-chunk?${params.toString()}`, {
                method: "PUT",
                credentials: "same-origin",
                body: chunk,
              });
              // Success or non-retryable error: break
              if (chunkRes.ok || (chunkRes.status >= 400 && chunkRes.status < 500)) break;
              // Server error (5xx): retry after backoff
              if (attempts < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 1000 * attempts));
              }
            } catch (networkErr) {
              if (attempts >= MAX_RETRIES) throw networkErr;
              await new Promise((r) => setTimeout(r, 1000 * attempts));
            }
          }

          if (!chunkRes || !chunkRes.ok) {
            const data = await chunkRes?.json().catch(() => ({})) as { error?: string; details?: string } | undefined;
            const msg = [data?.error, data?.details].filter(Boolean).join(" — ") || `Chunk upload failed: ${chunkRes?.status ?? "network error"}`;
            setError(msg);
            throw new Error(msg);
          }

          const result = await chunkRes.json() as { done: boolean; fileId?: string };

          if (result.done) {
            fileId = result.fileId ?? "";
          }

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
        if (!error) setError(msg);
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
