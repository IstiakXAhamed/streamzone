"use client";

import { useCallback, useRef, useState } from "react";

export interface DriveUploadResult {
  id: string;
  name: string;
  size: number | null;
  mimeType: string;
  thumbnailLink: string | null;
}

/**
 * Pick a file from PC and upload it through our server to Google Drive
 * (server-side upload avoids browser CORS issues with resumable URLs).
 */
export function useDriveUpload() {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<XMLHttpRequest | null>(null);

  const startUpload = useCallback(
    async (file: File, onProgress?: (pct: number) => void): Promise<DriveUploadResult> => {
      setBusy(true);
      setError(null);
      setProgress(0);
      onProgress?.(0);

      const result = await new Promise<DriveUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortRef.current = xhr;

        const form = new FormData();
        form.append("file", file);

        xhr.open("POST", "/api/drive/upload", true);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          onProgress?.(pct);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText) as DriveUploadResult);
            } catch {
              reject(new Error("Server returned invalid JSON"));
            }
          } else {
            let msg = `Upload failed: ${xhr.status}`;
            try {
              const body = JSON.parse(xhr.responseText) as { error?: string };
              msg = body.error ?? msg;
            } catch { /* ignore */ }
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.send(form);
      });

      setBusy(false);
      setProgress(100);
      onProgress?.(100);
      return result;
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  return { startUpload, cancel, progress, busy, error };
}
