"use client";

import { useState } from "react";

interface Cfg { siteName: string; tagline: string; accent: string; maintenanceMode: boolean; }

export function SaveSiteSettingsButton({ initial }: { initial: Cfg }) {
  const [cfg, setCfg] = useState<Cfg>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save() {
    setBusy(true); setErr(null); setOk(false);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error ?? "Save failed"); return; }
    setOk(true);
    setTimeout(() => setOk(false), 1500);
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => { e.preventDefault(); save(); }}
    >
      <Field label="Site name">
        <Input value={cfg.siteName} onChange={(e) => setCfg({ ...cfg, siteName: e.target.value })} />
      </Field>
      <Field label="Tagline">
        <Input value={cfg.tagline} onChange={(e) => setCfg({ ...cfg, tagline: e.target.value })} />
      </Field>
      <Field label="Brand accent">
        <Input type="color" value={cfg.accent} onChange={(e) => setCfg({ ...cfg, accent: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.maintenanceMode}
          onChange={(e) => setCfg({ ...cfg, maintenanceMode: e.target.checked })}
        /> Maintenance mode
      </label>
      {err && <p className="text-xs text-[color:var(--color-brand)]">{err}</p>}
      {ok && <p className="text-xs text-emerald-400">Saved.</p>}
      <button disabled={busy} className="rounded-full bg-[color:var(--color-brand)] px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
        {busy ? "Saving…" : "Save settings"}
      </button>
    </form>
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
