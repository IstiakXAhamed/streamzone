"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { useDriveUpload } from "@/hooks/useDriveUpload";

interface Props {
  label: string;
  accept?: string;
  onPicked: (fileId: string, fileName: string) => void;
}

/** Button that lets the admin pick a file from their PC, uploads it directly
 *  to Drive via the resumable-upload pipeline, and reports the resulting fileId. */
export function DriveFilePicker({ label, accept = "video/*,image/*", onPicked }: Props) {
  const [name, setName] = useState<string | null>(null);
  const { startUpload, progress, busy, error } = useDriveUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const meta = await startUpload(file);
      setName(meta.name);
      onPicked(meta.fileId, meta.name);
    } catch {
      setName(null);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm text-[color:var(--color-text-primary)]">
        {busy ? <Loader2 size={16} className="animate-spin" /> : name ? <Check size={16} className="text-emerald-400" /> : <Upload size={16} />}
        <span className="truncate">{busy ? `${progress}%` : name ?? label}</span>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} disabled={busy} />
      </label>
      {error && <span className="text-xs text-[color:var(--color-brand)]">{error}</span>}
    </div>
  );
}
