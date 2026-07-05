import { getServerSession } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authOptions } from "@/lib/authOptions";
import type { Role } from "@/types/db";
import { UserActions } from "./_components/UserActions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const callerRole = (session?.user?.role ?? "user") as Role;
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id,email,name,role,status,created_at,last_seen")
    .order("created_at", { ascending: false })
    .limit(200);

  const users = error || !data ? [] : data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <span className="text-xs text-[color:var(--color-text-tertiary)]">
          {users.length} shown
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface-2)] text-[color:var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="hidden px-4 py-3 text-left sm:table-cell">Role</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Status</th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-[color:var(--color-text-tertiary)]" colSpan={5}>
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[color:var(--color-surface-2)]/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{u.name ?? u.email}</p>
                  <p className="text-xs text-[color:var(--color-text-tertiary)]">{u.email}</p>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs uppercase">
                    {u.role}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <StatusPill status={u.status} />
                </td>
                <td className="hidden px-4 py-3 text-xs text-[color:var(--color-text-tertiary)] lg:table-cell">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <UserActions user={u} callerRole={callerRole} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    approved: "bg-emerald-500/20 text-emerald-400",
    suspended: "bg-rose-500/20 text-rose-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
