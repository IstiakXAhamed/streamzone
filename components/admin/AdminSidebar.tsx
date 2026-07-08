"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Film, Tv, Users, BarChart3, Radio, Settings, Shield, Home, type LucideIcon,
} from "lucide-react";

interface NavItem { href: string; label: string; Icon: LucideIcon; badge?: number; superOnly?: boolean; }

export function AdminSidebar({ pendingCount, role }: { pendingCount: number; role: string }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/admin/movies", label: "Movies", Icon: Film },
    { href: "/admin/series", label: "Series", Icon: Tv },
    { href: "/admin/users", label: "Users", Icon: Users, badge: pendingCount },
    { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
    { href: "/admin/rooms", label: "Rooms", Icon: Radio },
    { href: "/admin/settings", label: "Settings", Icon: Settings },
    { href: "/admin/logs", label: "Audit log", Icon: Shield, superOnly: true },
  ];

  const visible = items.filter((i) => !i.superOnly || role === "superadmin");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] md:flex">
      <Link href="/admin" className="flex h-14 items-center gap-2 px-5 text-lg font-extrabold tracking-tight text-[color:var(--color-brand)]">
        Admin
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {visible.map(({ href, label, Icon, badge }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center justify-between rounded-lg px-3 text-sm ${
                active
                  ? "bg-[color:var(--color-surface-3)] text-white"
                  : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} />
                {label}
              </span>
              {!!badge && (
                <span className="rounded-full bg-[color:var(--color-brand)] px-2 py-0.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[color:var(--color-border-subtle)] px-2 py-2">
        <Link
          href="/"
          className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)] hover:text-white"
        >
          <Home size={16} />
          Back to site
        </Link>
      </div>

      <div className="border-t border-[color:var(--color-border-subtle)] px-4 py-3 text-xs text-[color:var(--color-text-tertiary)]">
        Role: <span className="font-semibold uppercase text-[color:var(--color-text-primary)]">{role}</span>
      </div>
    </aside>
  );
}
