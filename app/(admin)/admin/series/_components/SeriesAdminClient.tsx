"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";
import type { SeriesRow } from "@/types/db";
import { AddEpisodeButton } from "./AddEpisodeButton";
import { AddSeriesButton } from "./AddSeriesButton";

interface EpisodeRow {
  id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration_seconds: number | null;
}

export function SeriesAdminClient({ initial }: { initial: SeriesRow[] }) {
  const [series, setSeries] = useState<SeriesRow[]>(initial);
  const [, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/series/ingest");
      const body = (await res.json()) as { series: SeriesRow[] };
      setSeries(body.series ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/series/ingest");
        const body = (await res.json()) as { series: SeriesRow[] };
        if (active) setSeries(body.series ?? []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function deleteSeries(s: SeriesRow) {
    if (!confirm(`Delete "${s.title}" and all ${s.episodes_count} episode(s)? This cannot be undone. (Drive files are not deleted.)`)) {
      return;
    }
    const res = await fetch("/api/series/ingest", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "series", id: s.id }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      alert(body.error ?? "Failed to delete series");
      return;
    }
    if (expanded === s.id) setExpanded(null);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Series</h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            A series has one or more seasons. Upload episodes per-season from your PC directly to Drive.
          </p>
        </div>
        <AddSeriesButton onCreated={refresh} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface-2)] text-[color:var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Seasons</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Episodes</th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
            {series.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--color-text-tertiary)]">
                  No series yet. Click &quot;Add series&quot; to create your first.
                </td>
              </tr>
            )}
            {series.map((s) => (
              <Fragment key={s.id}>
                <tr className="hover:bg-[color:var(--color-surface-2)]/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
                        aria-label={expanded === s.id ? "Hide episodes" : "Show episodes"}
                        className="text-[color:var(--color-text-tertiary)] hover:text-white"
                      >
                        {expanded === s.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <div>
                        <p className="font-medium text-white">{s.title}</p>
                        <p className="text-xs text-[color:var(--color-text-tertiary)]">{s.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{s.seasons_count}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{s.episodes_count}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs uppercase">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <AddEpisodeButton seriesId={s.id} onAdded={refresh} />
                      <button
                        type="button"
                        onClick={() => deleteSeries(s)}
                        aria-label={`Delete ${s.title}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-tertiary)] transition-colors hover:bg-red-500/15 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === s.id && (
                  <tr className="bg-[color:var(--color-surface-1)]">
                    <td colSpan={5} className="px-4 py-3">
                      <EpisodeManager seriesId={s.id} onChanged={refresh} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EpisodeManager({ seriesId, onChanged }: { seriesId: string; onChanged: () => void }) {
  const [episodes, setEpisodes] = useState<EpisodeRow[] | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/series/ingest?seriesId=${seriesId}`);
    const body = (await res.json().catch(() => ({}))) as { episodes?: EpisodeRow[] };
    setEpisodes(body.episodes ?? []);
  }, [seriesId]);

  useEffect(() => { load(); }, [load]);

  async function deleteEpisode(ep: EpisodeRow) {
    if (!confirm(`Delete S${ep.season_number}:E${ep.episode_number} "${ep.title}"? This cannot be undone.`)) {
      return;
    }
    setDeleting(ep.id);
    try {
      const res = await fetch("/api/series/ingest", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "episode", episodeId: ep.id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        alert(body.error ?? "Failed to delete episode");
        return;
      }
      await load();
      onChanged();
    } finally {
      setDeleting(null);
    }
  }

  if (episodes === null) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-[color:var(--color-text-tertiary)]">
        <Loader2 size={14} className="animate-spin" /> Loading episodes…
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <p className="py-2 text-xs text-[color:var(--color-text-tertiary)]">
        No episodes yet. Use &quot;Add episode&quot; to upload one.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {episodes.map((ep) => (
        <li
          key={ep.id}
          className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--color-surface-2)] px-3 py-2 text-xs"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="shrink-0 rounded bg-[color:var(--color-surface-4)] px-1.5 py-0.5 font-mono">
              S{ep.season_number}:E{ep.episode_number}
            </span>
            <span className="truncate">{ep.title}</span>
          </span>
          <button
            type="button"
            onClick={() => deleteEpisode(ep)}
            disabled={deleting === ep.id}
            aria-label={`Delete episode ${ep.title}`}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-tertiary)] transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
          >
            {deleting === ep.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </li>
      ))}
    </ul>
  );
}
