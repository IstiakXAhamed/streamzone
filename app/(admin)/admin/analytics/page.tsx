import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function fetchAnalytics(numDays: number) {
  const { data: watches } = await supabaseAdmin.from("watch_history").select("watched_at");
  const { data: users } = await supabaseAdmin.from("users").select("created_at");
  const d = new Map<string, { watches: number; newUsers: number }>();
  const today = new Date();
  for (let i = 0; i < numDays; i++) {
    const k = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    d.set(k, { watches: 0, newUsers: 0 });
  }
  (watches ?? []).forEach((r: { watched_at: string }) => {
    const k = new Date(r.watched_at).toISOString().slice(0, 10);
    if (d.has(k)) (d.get(k)!).watches++;
  });
  (users ?? []).forEach((u: { created_at: string }) => {
    const k = new Date(u.created_at).toISOString().slice(0, 10);
    if (d.has(k)) (d.get(k)!).newUsers++;
  });
  return Array.from(d.entries())
    .map(([day, v]) => ({ day: day.slice(5), watches: v.watches, newUsers: v.newUsers }))
    .reverse();
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: daysParam } = await searchParams;
  const days = Math.min(90, Math.max(7, parseInt(daysParam ?? "30", 10) || 30));
  const data = await fetchAnalytics(days);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`/admin/analytics?days=${d}`}
              className={`rounded-full px-3 py-1.5 text-sm ${d === days ? "bg-[color:var(--color-brand)] text-white" : "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-secondary)]"}`}
            >{d}d</a>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
        <h2 className="mb-2 text-sm font-semibold">Watch sessions · last {days}d</h2>
        <p className="text-xs text-[color:var(--color-text-tertiary)]">Total watches in this range: {data.reduce((s, x) => s + x.watches, 0)}</p>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
        <h2 className="mb-2 text-sm font-semibold">New sign-ups · last {days}d</h2>
        <p className="text-xs text-[color:var(--color-text-tertiary)]">Total sign-ups in this range: {data.reduce((s, x) => s + x.newUsers, 0)}</p>
      </div>
    </div>
  );
}
