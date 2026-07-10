"use client";

import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { UserActions } from "./UserActions";
import type { Role } from "@/types/db";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: "pending" | "approved" | "suspended";
  created_at: string;
  last_seen: string;
}

const STATUS_CLASS: Record<UserRow["status"], string> = {
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  suspended: "bg-rose-500/20 text-rose-400",
};

export function UsersTable({ users, callerRole }: { users: UserRow[]; callerRole: Role }) {
  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "user",
      header: "User",
      sortValue: (u) => (u.name ?? u.email).toLowerCase(),
      render: (u) => (
        <>
          <p className="font-medium text-white">{u.name ?? u.email}</p>
          <p className="text-xs text-[color:var(--color-text-tertiary)]">{u.email}</p>
        </>
      ),
    },
    {
      key: "role",
      header: "Role",
      hideBelow: "sm",
      sortValue: (u) => u.role,
      render: (u) => <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs uppercase">{u.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      hideBelow: "md",
      sortValue: (u) => u.status,
      render: (u) => <span className={["rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLASS[u.status]].join(" ")}>{u.status}</span>,
    },
    {
      key: "created_at",
      header: "Joined",
      hideBelow: "lg",
      sortValue: (u) => new Date(u.created_at).getTime(),
      render: (u) => <span className="text-xs text-[color:var(--color-text-tertiary)]">{new Date(u.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => <UserActions user={u} callerRole={callerRole} />,
    },
  ];

  return <DataTable columns={columns} rows={users} getRowKey={(u) => u.id} emptyMessage="No users yet." />;
}
