"use client";

import { useTransition, useState } from "react";
import type { Role } from "@/types/db";
import { ConfirmActionModal } from "@/components/admin/ConfirmActionModal";

interface Summary {
  id: string;
  email: string;
  role: Role;
  status: "pending" | "approved" | "suspended";
}

export function UserActions({ user, callerRole }: { user: Summary; callerRole: Role }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  function act(action: "approve" | "suspend" | "promote_admin" | "demote_user") {
    setError(null);
    start(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, targetUserId: user.id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: unknown };
        setError(Array.isArray(body.error) ? "Invalid request" : ((body.error as string) ?? "Action failed"));
        return;
      }
      window.location.reload();
    });
  }

  const disableApprove = user.status === "approved";
  const disableSuspend = user.status === "suspended";
  const canChangeRole = callerRole === "superadmin" && user.id !== "";

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        disabled={isPending || disableApprove}
        onClick={() => act("approve")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          disableApprove
            ? "cursor-not-allowed bg-[color:var(--color-surface-3)] text-[color:var(--color-text-tertiary)]"
            : "bg-emerald-600 text-white hover:bg-emerald-500"
        }`}
      >
        Approve
      </button>
      <button
        disabled={isPending || disableSuspend}
        onClick={() => setConfirmSuspend(true)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          disableSuspend
            ? "cursor-not-allowed bg-[color:var(--color-surface-3)] text-[color:var(--color-text-tertiary)]"
            : "bg-rose-600 text-white hover:bg-rose-500"
        }`}
      >
        Suspend
      </button>
      <ConfirmActionModal
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={() => {
          setConfirmSuspend(false);
          act("suspend");
        }}
        title="Suspend this user?"
        itemLabel={user.email}
        confirmLabel="Suspend"
        confirming={isPending}
      />
      {canChangeRole && user.role === "user" && (
        <button
          disabled={isPending}
          onClick={() => act("promote_admin")}
          className="rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-[color:var(--color-surface-3)]"
        >
          → admin
        </button>
      )}
      {canChangeRole && user.role === "admin" && (
        <button
          disabled={isPending}
          onClick={() => act("demote_user")}
          className="rounded-full bg-[color:var(--color-surface-3)] px-3 py-1 text-xs font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-4)] disabled:cursor-not-allowed"
        >
          → user
        </button>
      )}
      {error && <span className="text-xs text-[color:var(--color-brand)]">{error}</span>}
    </span>
  );
}
