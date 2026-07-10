"use client";

/**
 * components/admin/AdminShell.tsx
 * Lifts the sidebar's collapsed state so the main content area's left
 * margin can respond (64px collapsed / 224px expanded on >=768px).
 */

import { useState, type ReactNode } from "react";
import { AdminSidebarInner } from "./AdminSidebar";

export function AdminShell({ pendingCount, role, children }: { pendingCount: number; role: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AdminSidebarInner pendingCount={pendingCount} role={role} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      <div className={["flex flex-1 flex-col transition-[margin] duration-200 [transition-timing-function:var(--ease-out)]", collapsed ? "md:ml-16" : "md:ml-56"].join(" ")}>
        {children}
      </div>
    </div>
  );
}
