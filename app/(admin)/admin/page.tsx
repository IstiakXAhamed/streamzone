import { supabaseAdmin } from "@/lib/supabase/admin";
import { Film, Users, Activity, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [{ count: users }, { count: movies }, { count: pending }, { count: watches }] =
    await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("movies").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("watch_history").select("id", { count: "exact", head: true }),
    ]);

  const tiles = [
    { label: "Total users", value: users ?? 0, Icon: Users, accent: "text-sky-400" },
    { label: "Pending approvals", value: pending ?? 0, Icon: Activity, accent: "text-amber-400" },
    { label: "Movies in catalog", value: movies ?? 0, Icon: Film, accent: "text-rose-400" },
    { label: "Watch sessions", value: watches ?? 0, Icon: Eye, accent: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[color:var(--color-text-secondary)]">What&apos;s happening in your MovieZone.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)]/60 p-4"
          >
            <div className="flex items-center justify-between">
              <Icon size={20} className={accent} />
              <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
