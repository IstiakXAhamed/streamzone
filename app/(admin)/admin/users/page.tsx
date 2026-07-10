import { getServerSession } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authOptions } from "@/lib/authOptions";
import type { Role } from "@/types/db";
import { UsersTable } from "./_components/UsersTable";

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
        <span className="text-xs text-[color:var(--color-text-tertiary)]">{users.length} shown</span>
      </div>

      <UsersTable users={users} callerRole={callerRole} />
    </div>
  );
}
