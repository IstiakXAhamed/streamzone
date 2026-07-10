/**
 * app/(site)/profile/_components/ProfileContent.tsx
 * Header (avatar w/ edit overlay, name, email, role badge, "Member since
 * MMM YYYY"); stats card row via computeWatchStats (zeros/None when
 * empty); Continue Watching carousel via continueWatching (<=30, progress
 * bars) + empty state; account action list with chevrons/dividers;
 * sign-out via client SignOutButton + confirmation Modal.
 * (Req 12.1-12.8)
 */

import Link from "next/link";
import { ChevronRight, Pencil, ShieldCheck } from "lucide-react";
import { CarouselRow } from "@/components/carousel/CarouselRow";
import type { MovieCardData } from "@/components/home/MovieCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { computeWatchStats, type WatchStatsEntry } from "@/lib/ui/watch-stats";
import { SignOutButton } from "./SignOutButton";

export interface ProfileUser {
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string | null;
}

const ACCOUNT_ACTIONS = [
  { label: "Edit Profile", href: "/profile/edit" },
  { label: "Notification Settings", href: "/profile/notifications" },
  { label: "Privacy", href: "/profile/privacy" },
];

function memberSinceLabel(createdAt: string | null): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Member since ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export function ProfileContent({
  user,
  watchHistory,
  continueWatchingCards,
}: {
  user: ProfileUser;
  watchHistory: WatchStatsEntry[];
  continueWatchingCards: MovieCardData[];
}) {
  const stats = computeWatchStats(watchHistory);
  const memberSince = memberSinceLabel(user.createdAt);
  const isAdmin = user.role === "admin" || user.role === "superadmin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-center gap-4">
        <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-2xl font-bold">
              {user.name?.[0] ?? user.email?.[0] ?? "U"}
            </div>
          )}
          <div className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
            <Pencil aria-hidden="true" className="h-5 w-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-heading">{user.name ?? "Your profile"}</h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">{user.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs font-semibold uppercase text-[color:var(--color-text-secondary)]">
              {user.role}
            </span>
            {memberSince ? <span className="text-xs text-[color:var(--color-text-tertiary)]">{memberSince}</span> : null}
          </div>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[color:var(--color-surface-2)] p-4 text-center">
          <p className="text-title">{stats.uniqueMovies}</p>
          <p className="text-xs text-[color:var(--color-text-tertiary)]">Movies watched</p>
        </div>
        <div className="rounded-xl bg-[color:var(--color-surface-2)] p-4 text-center">
          <p className="text-title">{stats.totalHours}</p>
          <p className="text-xs text-[color:var(--color-text-tertiary)]">Hours watched</p>
        </div>
        <div className="rounded-xl bg-[color:var(--color-surface-2)] p-4 text-center">
          <p className="text-title">{stats.favoriteGenre ?? "None"}</p>
          <p className="text-xs text-[color:var(--color-text-tertiary)]">Favorite genre</p>
        </div>
      </section>

      <section className="mb-8">
        {continueWatchingCards.length === 0 ? (
          <EmptyState
            illustration={<span className="text-4xl">🎬</span>}
            title="Nothing in progress"
            body="Movies you start watching will show up here."
          />
        ) : (
          <CarouselRow title="Continue Watching" movies={continueWatchingCards} />
        )}
      </section>

      {isAdmin ? (
        <section className="mb-4">
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-xl border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand)]/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-[color:var(--color-brand)]/20"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[color:var(--color-brand)]" />
              Admin Panel
            </span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-[color:var(--color-brand)]" />
          </Link>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl bg-[color:var(--color-surface-1)]">
        {ACCOUNT_ACTIONS.map((action, i) => (
          <Link
            key={action.href}
            href={action.href}
            className={[
              "flex items-center justify-between px-4 py-3 text-sm hover:bg-[color:var(--color-surface-3)]",
              i > 0 ? "border-t border-[color:var(--color-border-subtle)]" : "",
            ].join(" ")}
          >
            {action.label}
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-[color:var(--color-text-tertiary)]" />
          </Link>
        ))}
        <div className="border-t border-[color:var(--color-border-subtle)]">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
