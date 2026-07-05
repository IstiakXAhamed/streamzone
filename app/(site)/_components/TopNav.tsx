"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Search, Menu, LogOut } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/category/action", label: "Action" },
  { href: "/category/comedy", label: "Comedy" },
  { href: "/category/horror", label: "Horror" },
];

export function TopNav() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border-subtle)] bg-black/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-2 text-lg font-extrabold tracking-tight text-[color:var(--color-brand)]">
          MZ
        </Link>

        <ul className="hidden items-center gap-5 text-sm font-medium md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-[color:var(--color-text-secondary)] hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <Link
            aria-label="Search"
            href="/search"
            className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] hover:text-white"
          >
            <Search size={18} />
          </Link>
          {session?.user ? (
            <>
              <Link href="/profile" className="hidden h-8 w-8 overflow-hidden rounded-full bg-[color:var(--color-surface-3)] sm:block" title={session.user.email ?? "profile"}>
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover" src={session.user.image} alt="" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm font-semibold">
                    {session.user.name?.[0] ?? session.user.email?.[0] ?? "U"}
                  </div>
                )}
              </Link>
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] hover:text-white"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full bg-[color:var(--color-brand)] px-4 py-1.5 text-sm font-medium text-white">
                Sign in
              </Link>
              <button
                aria-label="Open menu"
                onClick={() => setOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] md:hidden"
              >
                <Menu size={18} />
              </button>
            </>
          )}
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={() => setOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-64 flex-col gap-3 bg-[color:var(--color-surface-1)] p-6"
          >
            <p className="text-lg font-bold tracking-tight text-white">Browse</p>
            {navLinks.map((l) => (
              <Link
                onClick={() => setOpen(false)}
                key={l.href}
                href={l.href}
                className="text-sm text-[color:var(--color-text-primary)]"
              >
                {l.label}
              </Link>
            ))}
          </aside>
        </div>
      )}
    </header>
  );
}
