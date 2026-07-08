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
 * Pick a file → get a Drive resumable session from our server → PUT bytes
 * through our proxy → Google Drive (avoids CORS, no token exposure).
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

      // 1. Server creates a resumable session and returns an opaque sessionId.
      const startRes = await fetch("/api/drive/upload-start", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: file.name, mimeType: file.type || undefined }),
      });
      const startText = await startRes.text();
      let startJson: Record<string, unknown> = {};
      try { startJson = JSON.parse(startText); } catch { /* empty body */ }
      if (!startRes.ok) {
        setBusy(false);
        const msg = (startJson.error as string) ?? `upload-start failed: ${startRes.status}`;
        setError(msg);
        throw new Error(msg);
      }
      const sessionId = startJson.sessionId as string;

      // 2. PUT bytes through our proxy (handles auth with Google).
      const result = await new Promise<DriveUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortRef.current = xhr;
        xhr.open("PUT", `/api/drive/upload-proxy?sessionId=${encodeURIComponent(sessionId)}`, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          onProgress?.(pct);
        };
        xhr.onload = () => {
          setBusy(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            let fileId = "";
            try {
              const respData = JSON.parse(xhr.responseText) as { fileId?: string };
              fileId = respData.fileId ?? "";
            } catch { /* use empty */ }
            resolve({
              id: fileId,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              thumbnailLink: null,
            });
          } else {
            let msg = `Upload failed: ${xhr.status}`;
            try {
              const errData = JSON.parse(xhr.responseText) as { error?: string };
              if (errData.error) msg = errData.error;
            } catch { /* use default */ }
            setError(msg);
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => { setBusy(false); const msg = "Upload network error"; setError(msg); reject(new Error(msg)); };
        xhr.onabort = () => { setBusy(false); const msg = "Upload cancelled"; setError(msg); reject(new Error(msg)); };
        xhr.send(file);
      });

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
