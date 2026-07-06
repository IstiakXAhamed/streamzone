"use client";

import { useState } from "react";
import { Plus, Upload, Loader2, ListPlus, FileVideo, X } from "lucide-react";
import { useDriveUpload } from "@/hooks/useDriveUpload";

type Mode = "single" | "batch";

export function AddEpisodeButton({ seriesId, onAdded }: { seriesId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("single");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const { startUpload, progress, busy: uploading } = useDriveUpload();

  function reset() {
    setMode("single"); setSeason(1); setEpisode(1); setTitle("");
    setBatchFiles([]); setErr(null); setOk(false); setBusy(false);
  }

  async function handleSingle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null); setOk(false);
    try {
      const meta = await startUpload(file);
      await saveEpisode(seriesId, season, episode, title || file.name.replace(/\.[^.]+$/, ""), meta.fileId);
      setOk(true);
      onAdded();
      setTimeout(() => { reset(); setOpen(false); }, 600);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleBatch(files: File[]) {
    if (files.length === 0) return;
    setBusy(true); setErr(null); setOk(false);
    try {
      // upload all files in parallel (bytes go browser -> Drive directly)
      const uploaded = await Promise.all(
        files.map((f) => startUpload(f).then((meta) => ({ name: f.name, driveFileId: meta.fileId }))),
      );
      // save episodes sequentially from the starting (season, episode)
      const s = season;
      let ep = episode;
      for (const up of uploaded) {
        await saveEpisode(seriesId, s, ep, up.name.replace(/\.[^.]+$/, ""), up.driveFileId);
        ep += 1;
      }
      setOk(true);
      onAdded();
      setTimeout(() => { reset(); setOpen(false); }, 800);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveEpisode(seriesId: string, season: number, episode: number, title: string, driveFileId: string) {
    const res = await fetch("/api/series/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "episode", seriesId, seasonNumber: season, episodeNumber: episode, title, driveFileId }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: unknown };
      throw new Error(JSON.stringify(body.error) || "Failed");
    }
  }

  return (
    <>
      <button onClick={() => { reset(); setOpen(true); }} className="inline-flex h-8 items-center gap-1 rounded-full bg-[color:var(--color-surface-3)] px-3 text-xs font-medium text-white hover:bg-[color:var(--color-surface-4)]">
        <Plus size={12} /> Add episode
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5">
            <h2 className="text-lg font-bold">Add episode</h2>

            {/* mode toggle */}
            <div className="flex gap-1 rounded-full bg-[color:var(--color-surface-2)] p-1">
              <button
                onClick={() => setMode("single")}
                className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-xs ${mode === "single" ? "bg-[color:var(--color-surface-4)] text-white" : "text-[color:var(--color-text-secondary)]"}`}
              ><FileVideo size={14} /> Single</button>
              <button
                onClick={() => setMode("batch")}
                className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-xs ${mode === "batch" ? "bg-[color:var(--color-surface-4)] text-white" : "text-[color:var(--color-text-secondary)]"}`}
              ><ListPlus size={14} /> Batch</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">Start season *</span>
                <input type="number" min={1} value={season} onChange={(e) => setSeason(Number(e.target.value))}
                  className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">Start episode *</span>
                <input type="number" min={1} value={episode} onChange={(e) => setEpisode(Number(e.target.value))}
                  className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none" />
              </label>
            </div>

            {mode === "single" && (
              <label className="block">
                <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">Title (optional — defaults to filename)</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pilot"
                  className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none" />
              </label>
            )}

            {mode === "single" ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:var(--color-border-subtle)] p-6 text-center text-sm text-[color:var(--color-text-secondary)]">
                {uploading ? <><Loader2 size={24} className="animate-spin" /><span>{progress}%</span></> : <><Upload size={24} /><span>Pick a video file from your PC</span></>}
                <input type="file" accept="video/*" className="hidden" onChange={handleSingle} disabled={busy} />
              </label>
            ) : (
              <div className="space-y-2">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:var(--color-border-subtle)] p-6 text-center text-sm text-[color:var(--color-text-secondary)]">
                  <Upload size={24} />
                  <span>Pick multiple video files (hold Ctrl/Cmd to multi-select)</span>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => setBatchFiles(Array.from(e.target.files ?? []))}
                  />
                </label>

                {batchFiles.length > 0 && (
                  <ul className="space-y-1">
                    {batchFiles.map((f, idx) => (
                      <li key={idx} className="flex items-center justify-between rounded-lg bg-[color:var(--color-surface-2)] px-3 py-1.5 text-xs">
                        <span className="flex items-center gap-2 truncate">
                          <FileVideo size={14} className="shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </span>
                        <span className="shrink-0 text-[color:var(--color-text-tertiary)]">
                          S{season}:E{episode + idx}
                        </span>
                        <button onClick={() => setBatchFiles((prev) => prev.filter((_, i) => i !== idx))} className="ml-2 text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-brand)]">
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {batchFiles.length > 0 && (
                  <button
                    disabled={busy}
                    onClick={() => handleBatch(batchFiles)}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-brand)] text-sm font-medium text-white disabled:opacity-60"
                  >
                    {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading {progress}%</> : <>Upload {batchFiles.length} episode{batchFiles.length > 1 ? "s" : ""}</>}
                  </button>
                )}
              </div>
            )}

            {err && <p className="text-xs text-[color:var(--color-brand)]">{err}</p>}
            {ok && <p className="text-xs text-emerald-400">Done.</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { reset(); setOpen(false); }} className="rounded-full px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
