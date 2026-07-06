"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";

interface FormValues {
  title: string;
  slug: string;
  description: string;
  year: number | "";
  genre: string;
  status: "ongoing" | "completed" | "hiatus";
  isPublic: boolean;
}
const defaults: FormValues = {
  title: "", slug: "", description: "", year: "", genre: "",
  status: "ongoing", isPublic: true,
};

export function AddSeriesButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: defaults });

  async function submit(v: FormValues) {
    setBusy(true); setErr(null); setOk(false);
    try {
      const res = await fetch("/api/series/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "series",
          title: v.title,
          slug: v.slug || undefined,
          description: v.description || null,
          year: v.year === "" ? null : Number(v.year),
          genre: v.genre.split(",").map((g) => g.trim()).filter(Boolean),
          status: v.status,
          isPublic: v.isPublic,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: unknown };
        setErr(JSON.stringify(body.error) || "Failed");
        return;
      }
      setOk(true);
      reset(defaults);
      onCreated();
      setTimeout(() => setOpen(false), 600);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[color:var(--color-brand)] px-4 text-sm font-medium text-white">
        <Plus size={16} /> Add series
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit(submit)}
            className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5">
            <h2 className="text-lg font-bold">Add series</h2>
            <Field label="Title *"><Input {...register("title")} placeholder="Breaking Bad" /></Field>
            <Field label="Slug (optional)"><Input {...register("slug")} placeholder="breaking-bad" /></Field>
            <Field label="Description"><textarea {...register("description")} className="h-20 w-full rounded-xl bg-[color:var(--color-surface-2)] p-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year"><Input type="number" {...register("year")} placeholder="2008" /></Field>
              <Field label="Genre (comma-sep)"><Input {...register("genre")} placeholder="Crime, Drama" /></Field>
            </div>
            <Field label="Status">
              <select {...register("status")} className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none">
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("isPublic")} /> Public</label>
            {err && <p className="text-xs text-[color:var(--color-brand)]">{err}</p>}
            {ok && <p className="text-xs text-emerald-400">Series created.</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm">Cancel</button>
              <button disabled={busy} className="rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[color:var(--color-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" />;
}
