"use client";

/**
 * app/(site)/profile/_components/SignOutButton.tsx
 * Client sign-out control with a confirmation Modal (backdrop-fade + scale
 * spring entry, Confirm/Cancel). (Req 12.7, 12.8)
 */

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[color:var(--color-error)] hover:bg-[color:var(--color-surface-3)]"
      >
        <span className="flex items-center gap-2">
          <LogOut aria-hidden="true" size={16} /> Sign Out
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy="signout-title">
        <h2 id="signout-title" className="text-title">
          Sign out?
        </h2>
        <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
          You&apos;ll need to sign in again to access your account.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="surface" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => signOut()}>
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
}
