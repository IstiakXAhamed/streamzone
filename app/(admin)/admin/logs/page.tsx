import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const { data: logs } = await supabaseAdmin
    .from("admin_activity_log")
    .select("id,admin_user_id,action,metadata,created_at,admin:users(name,email)")
    .order("created_at", { ascending: false })
    .limit(200);

  // CSV export link data is built inline
  const csvRows = (logs ?? []).map((l) => [
    l.created_at, (l.admin as unknown as { name?: string } | null)?.name ?? l.admin_user_id, l.action, JSON.stringify(l.metadata ?? {}),
  ]);
  // simple CSV generation via data URL for download
  const csvContent = "time,admin,action,metadata\n" + csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <a download="admin-audit.csv" href={csvDataUri} className="rounded-full bg-[color:var(--color-surface-3)] px-4 py-2 text-sm">⬇ Export CSV</a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface-2)] text-[color:var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 text-left">When</th>
              <th className="hidden px-4 py-3 text-left sm:table-cell">Admin</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
            {(logs ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[color:var(--color-text-tertiary)]">No activity yet.</td></tr>
            )}
            {(logs ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-[color:var(--color-surface-2)]/40">
                <td className="px-4 py-3 text-xs text-[color:var(--color-text-tertiary)]">{new Date(l.created_at).toLocaleString()}</td>
                <td className="hidden px-4 py-3 sm:table-cell">{(l.admin as unknown as { name?: string } | null)?.name ?? l.admin_user_id}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs uppercase">{l.action}</span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-[color:var(--color-text-tertiary)] lg:table-cell">
                  {l.metadata ? JSON.stringify(l.metadata).slice(0, 80) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
