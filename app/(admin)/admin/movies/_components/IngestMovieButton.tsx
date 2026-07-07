"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { DriveFilePicker } from "./DriveFilePicker";

interface FormValues {
  title: string;
  slug: string;
  description: string;
  year: number | "";
  durationSeconds: number | "";
  genre: string;
  rating: number | "";
  driveFileId: string;
  posterDriveFileId: string;
  backdropDriveFileId: string;
  trailerDriveFileId: string;
  featured: boolean;
  isPublic: boolean;
}
const defaults: FormValues = {
  title: "", slug: "", description: "", year: "", durationSeconds: "",
  genre: "", rating: "", driveFileId: "", posterDriveFileId: "",
  backdropDriveFileId: "", trailerDriveFileId: "", featured: false, isPublic: true,
};

export function IngestMovieButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: defaults,
  });
  const driveFileId = watch("driveFileId");

  async function submit(values: FormValues) {
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const num = (s: number | "") => (s === "" ? null : Number(s));
      const nullable = (s: string) => (s.trim().length ? s.trim() : null);
      const res = await fetch("/api/movies/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          slug: values.slug || undefined,
          description: nullable(values.description),
          year: num(values.year),
          durationSeconds: num(values.durationSeconds),
          genre: values.genre.split(",").map((g) => g.trim()).filter(Boolean),
          rating: num(values.rating),
          driveFileId: values.driveFileId,
          posterDriveFileId: nullable(values.posterDriveFileId),
          backdropDriveFileId: nullable(values.backdropDriveFileId),
          trailerDriveFileId: nullable(values.trailerDriveFileId),
          featured: values.featured,
          isPublic: values.isPublic,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: unknown };
        setErr(JSON.stringify(body.error) || "Ingestion failed");
        return;
      }
      setOk(true);
      reset(defaults);
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 800);
    } catch (e) {
      setErr((e as Error).message);
      return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[color:var(--color-brand)] px-4 text-sm font-medium text-white transition active:scale-[0.98]"
      >
        <Plus size={16} /> Add movie
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit(submit)}
            className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5"
          >
            <h2 className="text-lg font-bold">Add movie</h2>
            <p className="text-xs text-[color:var(--color-text-tertiary)]">
              Upload the MP4 directly from your PC. Bytes go straight to your
              Drive — our server never touches them.
            </p>

            <Field label="Title *" error={errors.title?.message}>
              <Input {...register("title")} placeholder="Inception" />
            </Field>
            <Field label="Slug (optional)" error={errors.slug?.message}>
              <Input {...register("slug")} placeholder="inception" />
            </Field>
            <Field label="MP4 file *">
              {driveFileId ? (
                <span className="flex h-10 items-center gap-2 rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm text-emerald-400">✓ Ready to upload</span>
              ) : (
                <DriveFilePicker label="Choose MP4" onPicked={(id) => setValue("driveFileId", id, { shouldValidate: true })} />
              )}
              <input type="hidden" {...register("driveFileId")} />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Poster image">
                <DriveFilePicker label="Upload poster" accept="image/*" onPicked={(id) => setValue("posterDriveFileId", id)} />
                <input type="hidden" {...register("posterDriveFileId")} />
              </Field>
              <Field label="Backdrop image">
                <DriveFilePicker label="Upload backdrop" accept="image/*" onPicked={(id) => setValue("backdropDriveFileId", id)} />
                <input type="hidden" {...register("backdropDriveFileId")} />
              </Field>
              <Field label="Trailer video">
                <DriveFilePicker label="Upload trailer" accept="video/*" onPicked={(id) => setValue("trailerDriveFileId", id)} />
                <input type="hidden" {...register("trailerDriveFileId")} />
              </Field>
            </div>
            <Field label="Year">
              <Input type="number" {...register("year")} placeholder="2010" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (s)">
                <Input type="number" {...register("durationSeconds")} placeholder="7200" />
              </Field>
              <Field label="Rating (0-10)">
                <Input step="0.1" type="number" {...register("rating")} placeholder="8.8" />
              </Field>
            </div>

            <Field label="Genre (comma-separated)">
              <Input {...register("genre")} placeholder="Sci-Fi, Thriller" />
            </Field>
            <Field label="Description">
              <textarea
                {...register("description")}
                className="h-24 w-full rounded-xl bg-[color:var(--color-surface-2)] p-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
              />
            </Field>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("featured")} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("isPublic")} /> Public
              </label>
            </div>

            {err && <p className="text-xs text-[color:var(--color-brand)]">{err}</p>}
            {ok && <p className="text-xs text-emerald-400">Movie ingested.</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">{label}</span>
      {children}
      {error && <span className="block text-xs text-[color:var(--color-brand)]">{error}</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
    />
  );
}
