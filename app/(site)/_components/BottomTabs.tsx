"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, Users, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/saved", label: "Saved", Icon: Bookmark },
  { href: "/party/create", label: "Party", Icon: Users },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--color-border-subtle)] bg-black/90 backdrop-blur md:hidden">
      <ul className="mx-auto flex h-14 max-w-2xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, label, Icon }) => {
          const active =
            "/" === href ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`mx-auto flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs ${
                  active ? "text-white" : "text-[color:var(--color-text-tertiary)]"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
