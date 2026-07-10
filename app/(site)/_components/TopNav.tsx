"use client";

/**
 * app/(site)/_components/TopNav.tsx
 * Rebuild: brand, links, search trigger, notification badge (hidden at 0),
 * avatar >=768px; scroll-aware condense (64->48px, bg 80%->95% at >64px,
 * 200ms ease-out); animated hover underline (150ms); z-index>=50 +
 * backdrop-filter blur(12px); full-screen mobile overlay (8px backdrop
 * blur, 50ms staggered items, FocusTrap, Escape/backdrop/close dismissal
 * returning focus to the hamburger).
 * (Req 2.1-2.8)
 */

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, LogOut, Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FocusTrap } from "@/components/layout/FocusTrap";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { isTabActive } from "@/lib/ui/active-route";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/category/action", label: "Action" },
  { href: "/category/comedy", label: "Comedy" },
  { href: "/category/horror", label: "Horror" },
  { href: "/friends", label: "Friends" },
  { href: "/party/create", label: "Party" },
];

const CONDENSE_SCROLL_THRESHOLD = 64;

export function TopNav({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleScroll() {
      setCondensed(window.scrollY > CONDENSE_SCROLL_THRESHOLD);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b border-[color:var(--color-border-subtle)] backdrop-blur-[12px] transition-[height,background-color] duration-200 [transition-timing-function:var(--ease-out)]",
        condensed ? "bg-black/95" : "bg-black/80",
      ].join(" ")}
    >
      <nav
        className={[
          "mx-auto flex max-w-7xl items-center gap-4 px-4 transition-[height] duration-200 [transition-timing-function:var(--ease-out)] sm:px-6 lg:px-8",
          condensed ? "h-12" : "h-16",
        ].join(" ")}
      >
        <Link href="/" className="mr-2 text-lg font-extrabold tracking-tight text-[color:var(--color-brand)]">
          MovieZone
        </Link>

        <ul className="hidden items-center gap-5 text-sm font-medium md:flex">
          {navLinks.map((l) => {
            const active = isTabActive(pathname, l.href);
            return (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  className={[
                    "group relative inline-block py-1 text-[color:var(--color-text-secondary)] hover:text-white",
                    active ? "text-white" : "",
                  ].join(" ")}
                >
                  {l.label}
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-[color:var(--color-brand)] transition-transform duration-150 [transition-timing-function:var(--ease-out)] group-hover:scale-x-100",
                      active ? "scale-x-100" : "",
                    ].join(" ")}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] hover:text-white"
          >
            <Search aria-hidden="true" size={18} />
          </button>

          <button
            type="button"
            aria-label={unreadNotifications > 0 ? `Notifications (${unreadNotifications} unread)` : "Notifications"}
            className="relative hidden h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] hover:text-white md:grid"
          >
            <Bell aria-hidden="true" size={18} />
            {unreadNotifications > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--color-brand)] px-1 text-[10px] font-bold text-white"
              >
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            ) : null}
          </button>

          {status === "loading" ? (
            <div className="h-8 w-8 rounded-full bg-[color:var(--color-surface-2)]" />
          ) : session?.user ? (
            <>
              <Link
                href="/profile"
                className="hidden h-8 w-8 overflow-hidden rounded-full bg-[color:var(--color-surface-3)] md:block"
                title={session.user.email ?? "profile"}
              >
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
                className="hidden h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] hover:text-white md:grid"
              >
                <LogOut aria-hidden="true" size={18} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-[color:var(--color-brand)] px-4 py-1.5 text-sm font-medium text-white md:block"
            >
              Sign in
            </Link>
          )}

          <button
            ref={hamburgerRef}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] md:hidden"
          >
            <Menu aria-hidden="true" size={18} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <FocusTrap active={open} onClose={closeMenu}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-[8px] md:hidden"
              onClick={closeMenu}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex h-full flex-col gap-1 p-6 pt-20"
              >
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={closeMenu}
                  className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-white"
                >
                  <X aria-hidden="true" size={20} />
                </button>
                {navLinks.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i * 50) / 1000, duration: 0.2 }}
                  >
                    <Link
                      href={l.href}
                      onClick={closeMenu}
                      className="block py-3 text-xl font-semibold text-white"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
                {session?.user ? (
                  <button
                    onClick={() => {
                      closeMenu();
                      signOut();
                    }}
                    className="mt-4 flex items-center gap-2 py-3 text-left text-lg text-[color:var(--color-text-secondary)]"
                  >
                    <LogOut aria-hidden="true" size={18} />
                    Sign out
                  </button>
                ) : (
                  <Link href="/login" onClick={closeMenu} className="mt-4 py-3 text-lg text-[color:var(--color-brand)]">
                    Sign in
                  </Link>
                )}
              </div>
            </motion.div>
          </FocusTrap>
        ) : null}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
