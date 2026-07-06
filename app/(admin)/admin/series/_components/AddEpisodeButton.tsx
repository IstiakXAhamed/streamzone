"use client";

import { useState } from "react";
import { Plus, Upload, Loader2 } from "lucide-react";
import { useDriveUpload } from "@/hooks/useDriveUpload";

export function AddEpisodeButton({ seriesId, onAdded }: { seriesId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const { startUpload, progress, busy: uploading } = useDriveUpload();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null); setOk(false);
    try {
      const meta = await startUpload(file);
      const res = await fetch("/api/series/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "episode",
          seriesId,
          seasonNumber: season,
          episodeNumber: episode,
          title: title || file.name.replace(/\.[^.]+$/, ""),
          driveFileId: meta.fileId,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: unknown };
        setErr(JSON.stringify(body.error) || "Failed");
        return;
      }
      setOk(true);
      onAdded();
      setTimeout(() => setOpen(false), 600);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex h-8 items-center gap-1 rounded-full bg-[color:var(--color-surface-3)] px-3 text-xs font-medium text-white hover:bg-[color:var(--color-surface-4)]">
        <Plus size={12} /> Add episode
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5">
            <h2 className="text-lg font-bold">Add episode</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">Season *</span>
                <input type="number" min={1} value={season} onChange={(e) => setSeason(Number(e.target.value))}
                  className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">Episode *</span>
                <input type="number" min={1} value={episode} onChange={(e) => setEpisode(Number(e.target.value))}
                  className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">Title (optional — defaults to filename)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pilot"
                className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none" />
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:var(--color-border-subtle)] p-6 text-center text-sm text-[color:var(--color-text-secondary)]">
              {uploading ? <><Loader2 size={24} className="animate-spin" /><span>{progress}%</span></> : <><Upload size={24} /><span>Pick a video file from your PC</span></>}
              <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={busy} />
            </label>

            {err && <p className="text-xs text-[color:var(--color-brand)]">{err}</p>}
            {ok && <p className="text-xs text-emerald-400">Episode added.</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
