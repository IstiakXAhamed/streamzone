"use client";

import { useCallback, useRef, useState } from "react";

export interface DriveUploadResult {
  fileId: string;
  name: string;
  size: number | null;
  mimeType: string;
  thumbnailLink: string | null;
}

/**
 * Pick a file from PC and upload it directly to Google Drive (bytes go
 * browser -> Google, zero server bandwidth). Returns startUpload(file, onProgress).
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

      // 1. Ask our server to create a resumable session (tiny server bytes).
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

      // 2. PUT the bytes directly to Google Drive. Track progress locally.
      const fileId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortRef.current = xhr;
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          onProgress?.(pct);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const meta = JSON.parse(xhr.responseText) as { id: string };
              resolve(meta.id);
            } catch {
              reject(new Error("Drive upload returned invalid metadata"));
            }
          } else {
            reject(new Error(`Drive PUT failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Drive PUT network error"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.send(file);
      });

      // 3. Confirm + fetch metadata from our server.
      const finRes = await fetch("/api/drive/upload-finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (!finRes.ok) {
        const body = (await finRes.json().catch(() => ({}))) as { error?: string };
        setBusy(false);
        throw new Error(body.error ?? `upload-finalize failed: ${finRes.status}`);
      }
      const meta = (await finRes.json()) as DriveUploadResult;
      setBusy(false);
      setProgress(100);
      onProgress?.(100);
      return meta;
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
