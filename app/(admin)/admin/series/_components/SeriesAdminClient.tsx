"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { SeriesRow } from "@/types/db";
import { AddEpisodeButton } from "./AddEpisodeButton";
import { AddSeriesButton } from "./AddSeriesButton";

export function SeriesAdminClient({ initial }: { initial: SeriesRow[] }) {
  const [series, setSeries] = useState<SeriesRow[]>(initial);
  const [loading, setLoading] = useState(false);

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
              <th className="px-4 py-3 text-right">Episodes</th>
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
              <tr key={s.id} className="hover:bg-[color:var(--color-surface-2)]/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{s.title}</p>
                  <p className="text-xs text-[color:var(--color-text-tertiary)]">{s.slug}</p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">{s.seasons_count}</td>
                <td className="hidden px-4 py-3 md:table-cell">{s.episodes_count}</td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs uppercase">
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <AddEpisodeButton seriesId={s.id} onAdded={refresh} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
