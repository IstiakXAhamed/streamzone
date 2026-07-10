import { supabaseAdmin } from "@/lib/supabase/admin";
import { Film, Users, Activity, Eye } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";

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
    { label: "Total users", value: users ?? 0, Icon: Users, accentClassName: "text-sky-400" },
    { label: "Pending approvals", value: pending ?? 0, Icon: Activity, accentClassName: "text-amber-400" },
    { label: "Movies in catalog", value: movies ?? 0, Icon: Film, accentClassName: "text-rose-400" },
    { label: "Watch sessions", value: watches ?? 0, Icon: Eye, accentClassName: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[color:var(--color-text-secondary)]">What&apos;s happening in your MovieZone.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => <StatCard key={tile.label} {...tile} />)}
      </div>
    </div>
  );
}
