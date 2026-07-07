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
 * directly browser→Google Drive (zero server bandwidth, no size limit).
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

      // 1. Server creates a resumable session (tiny bytes). Returns uploadUrl + fileId.
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
        throw new Error((startJson.error as string) ?? `upload-start failed: ${startRes.status}`);
      }
      const uploadUrl = startJson.uploadUrl as string;
      const fileId = startJson.fileId as string;

      // 2. PUT bytes directly to Google (no server proxy → no size limit).
      const result = await new Promise<DriveUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortRef.current = xhr;
        xhr.open("PUT", uploadUrl, true);
        // Do NOT set Content-Type here — the resumable session already declared it.
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          onProgress?.(pct);
        };
        xhr.onload = () => {
          setBusy(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              id: fileId,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              thumbnailLink: null,
            });
          } else {
            reject(new Error(`Drive PUT failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => { setBusy(false); reject(new Error("Drive PUT network error")); };
        xhr.onabort = () => { setBusy(false); reject(new Error("Upload cancelled")); };
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
