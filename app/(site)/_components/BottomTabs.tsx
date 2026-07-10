"use client";

/**
 * app/(site)/_components/BottomTabs.tsx
 * Rebuild: exactly 5 tabs, >=48px touch targets, active pill (layoutId,
 * 200ms spring) via isTabActive, aria-current="page", role="navigation"
 * + label, frosted glass (blur>=10px, 70-90% opacity), safe-area-inset-bottom
 * padding, Vibration API haptic with graceful fallback + scale press,
 * tap-active-tab-scrolls-to-top, hidden >=768px.
 * (Req 3.1-3.8)
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, Users, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { isTabActive } from "@/lib/ui/active-route";
import { SearchOverlay } from "@/components/search/SearchOverlay";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/search", label: "Search", Icon: Search, isSearch: true },
  { href: "/saved", label: "Saved", Icon: Bookmark },
  { href: "/party/create", label: "Party", Icon: Users },
  { href: "/profile", label: "Profile", Icon: User },
];

function triggerHapticFeedback() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Some browsers advertise the API but throw (e.g. disabled by
      // permissions policy); fail silently and continue with navigation.
    }
  }
}

export function BottomTabs() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  function handleTabClick(e: React.MouseEvent, active: boolean, isSearch?: boolean) {
    triggerHapticFeedback();
    if (isSearch) {
      e.preventDefault();
      setSearchOpen(true);
      return;
    }
    if (active) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-border-subtle)] bg-black/80 backdrop-blur-[10px] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex h-14 max-w-2xl items-stretch justify-around px-2">
          {tabs.map(({ href, label, Icon, isSearch }) => {
            const active = isTabActive(pathname, href);
            return (
              <li key={href} className="relative flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => handleTabClick(e, active, isSearch)}
                  className="relative mx-auto flex h-full min-h-[48px] w-full flex-col items-center justify-center gap-0.5 text-xs"
                >
                  {active ? (
                    <motion.span
                      layoutId="bottom-tabs-active-pill"
                      className="absolute inset-x-2 top-1 bottom-1 rounded-full bg-[color:var(--color-surface-3)]"
                      transition={{ type: "spring", stiffness: 300, damping: 26, duration: 0.2 }}
                    />
                  ) : null}
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.1 }}
                    className={[
                      "relative z-10 flex flex-col items-center gap-0.5",
                      active ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-text-tertiary)]",
                    ].join(" ")}
                  >
                    <Icon aria-hidden="true" size={20} />
                    <span>{label}</span>
                  </motion.span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
