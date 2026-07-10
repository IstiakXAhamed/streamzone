"use client";

/**
 * components/admin/AdminSidebar.tsx
 * Rebuild: collapse toggle (->64px icon-only >=768px), Content/Users/System
 * groupings, brand active state; <768px converts to a bottom Sheet
 * triggered by a menu button. (Req 13.1, 13.5)
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Film, Tv, Users, BarChart3, Radio, Settings, Shield, Home,
  ChevronsLeft, ChevronsRight, Menu, type LucideIcon,
} from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { isTabActive } from "@/lib/ui/active-route";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: number;
  superOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function buildGroups(pendingCount: number): NavGroup[] {
  return [
    { label: "", items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }] },
    {
      label: "Content",
      items: [
        { href: "/admin/movies", label: "Movies", Icon: Film },
        { href: "/admin/series", label: "Series", Icon: Tv },
      ],
    },
    {
      label: "Users",
      items: [{ href: "/admin/users", label: "Users", Icon: Users, badge: pendingCount }],
    },
    {
      label: "System",
      items: [
        { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
        { href: "/admin/rooms", label: "Rooms", Icon: Radio },
        { href: "/admin/settings", label: "Settings", Icon: Settings },
        { href: "/admin/logs", label: "Audit log", Icon: Shield, superOnly: true },
      ],
    },
  ];
}

function NavLink({ item, collapsed, active, onNavigate }: { item: NavItem; collapsed: boolean; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={[
        "flex h-10 items-center rounded-lg px-3 text-sm",
        collapsed ? "justify-center" : "justify-between",
        active
          ? "bg-[color:var(--color-brand)]/15 text-[color:var(--color-brand)]"
          : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)] hover:text-white",
      ].join(" ")}
    >
      <span className={["flex items-center gap-2", collapsed ? "gap-0" : ""].join(" ")}>
        <item.Icon aria-hidden="true" size={16} />
        {!collapsed ? item.label : null}
      </span>
      {!collapsed && !!item.badge ? (
        <span className="rounded-full bg-[color:var(--color-brand)] px-2 py-0.5 text-xs font-semibold text-white">{item.badge}</span>
      ) : null}
    </Link>
  );
}

function SidebarContent({
  groups,
  role,
  collapsed,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  role: string;
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-2">
        {groups.map((group) => {
          const visibleItems = group.items.filter((i) => !i.superOnly || role === "superadmin");
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label || "root"}>
              {group.label && !collapsed ? (
                <p className="mb-1 px-3 text-overline text-[color:var(--color-text-tertiary)]">{group.label}</p>
              ) : null}
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink key={item.href} item={item} collapsed={collapsed} active={isTabActive(pathname, item.href)} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[color:var(--color-border-subtle)] px-2 py-2">
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? "Back to site" : undefined}
          className={["flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)] hover:text-white", collapsed ? "justify-center" : ""].join(" ")}
        >
          <Home aria-hidden="true" size={16} />
          {!collapsed ? "Back to site" : null}
        </Link>
      </div>

      {!collapsed ? (
        <div className="border-t border-[color:var(--color-border-subtle)] px-4 py-3 text-xs text-[color:var(--color-text-tertiary)]">
          Role: <span className="font-semibold uppercase text-[color:var(--color-text-primary)]">{role}</span>
        </div>
      ) : null}
    </>
  );
}

export function AdminSidebarInner({
  pendingCount,
  role,
  collapsed,
  onToggleCollapsed,
}: {
  pendingCount: number;
  role: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = buildGroups(pendingCount);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] transition-[width] duration-200 [transition-timing-function:var(--ease-out)] md:flex",
          collapsed ? "w-16" : "w-56",
        ].join(" ")}
      >
        <div className="flex h-14 items-center justify-between px-3">
          {!collapsed ? (
            <Link href="/admin" className="text-lg font-extrabold tracking-tight text-[color:var(--color-brand)]">
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapsed}
            className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
          >
            {collapsed ? <ChevronsRight aria-hidden="true" size={16} /> : <ChevronsLeft aria-hidden="true" size={16} />}
          </button>
        </div>
        <SidebarContent groups={groups} role={role} collapsed={collapsed} pathname={pathname} />
      </aside>

      {/* Mobile trigger + bottom sheet */}
      <button
        type="button"
        aria-label="Open admin menu"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-brand)] text-white shadow-[var(--shadow-elevation-3)] md:hidden"
      >
        <Menu aria-hidden="true" size={20} />
      </button>
      <Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} labelledBy="admin-mobile-nav-title" heightVh={70}>
        <h2 id="admin-mobile-nav-title" className="mb-2 text-title">
          Admin Menu
        </h2>
        <div className="flex max-h-full flex-col">
          <SidebarContent groups={groups} role={role} collapsed={false} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </div>
      </Sheet>
    </>
  );
}

/** Standalone/back-compat entry point that manages its own collapse state. */
export function AdminSidebar({ pendingCount, role }: { pendingCount: number; role: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AdminSidebarInner pendingCount={pendingCount} role={role} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
  );
}
