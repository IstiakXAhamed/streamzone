import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const { data: rooms } = await supabaseAdmin
    .from("watch_party_rooms")
    .select("id,host_user_id,movie_id,created_at,movie:movies(title),host:users(name,email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Active rooms</h1>
      <p className="text-sm text-[color:var(--color-text-secondary)]">Rooms in Supabase Realtime live as long as participants track themselves. They auto-clean on a full leave.</p>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface-2)] text-[color:var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 text-left">Room</th>
              <th className="hidden px-4 py-3 text-left sm:table-cell">Host</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Movie</th>
              <th className="px-4 py-3 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
            {(rooms ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[color:var(--color-text-tertiary)]">No rooms yet.</td></tr>
            )}
            {(rooms ?? []).map((r) => {
              const host = r.host as unknown as { name?: string; email?: string } | null;
              const movie = r.movie as unknown as { title?: string } | null;
              return (
                <tr key={r.id} className="hover:bg-[color:var(--color-surface-2)]/40">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-white">{r.id.slice(0, 8)}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {host?.name ?? host?.email ?? r.host_user_id}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{movie?.title ?? r.movie_id}</td>
                  <td className="px-4 py-3 text-right text-xs text-[color:var(--color-text-tertiary)]">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
