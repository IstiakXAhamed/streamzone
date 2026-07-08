"use client";

import { useCallback, useRef, useState } from "react";

export interface DriveUploadResult {
  id: string;
  name: string;
  size: number | null;
  mimeType: string;
  thumbnailLink: string | null;
}

// 3.5MB chunks — safely under Vercel's 4.5MB request body limit.
// Must be a multiple of 256KB (Google's requirement for resumable uploads).
const CHUNK_SIZE = 256 * 1024 * 14; // 3,670,016 bytes = 3.5MB

/**
 * Uploads a file to Google Drive via chunked resumable upload through our server.
 * Flow: browser → /api/drive/upload-chunk → Google Drive
 * Supports files of any size.
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

        // 2. Upload in chunks
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

          const chunkRes = await fetch(`/api/drive/upload-chunk?${params.toString()}`, {
            method: "PUT",
            credentials: "same-origin",
            body: chunk,
          });

          if (!chunkRes.ok) {
            const data = await chunkRes.json().catch(() => ({})) as { error?: string; details?: string };
            // Surface Google's actual error (details) so failures are diagnosable.
            const msg = [data.error, data.details].filter(Boolean).join(" — ") || `Chunk upload failed: ${chunkRes.status}`;
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
