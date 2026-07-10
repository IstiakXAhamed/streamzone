"use client";

/**
 * app/(site)/friends/_components/FriendsContent.tsx
 * Rebuild: Tabs (Friends/Requests/Discover) sliding indicator; accept morph
 * (layoutId) Requests->Friends (<=400ms); online dot via isOnline;
 * debounced search (<=300ms) <=20 staggered results + empty state;
 * send-request checkmark->Pending; reject fade-out with no re-show.
 * (Req 9.1-9.6, 19.1)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, UserPlus, Users } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { isOnline } from "@/lib/ui/presence";
import { staggerDelays } from "@/lib/ui/layout-math";

type FriendUser = {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  last_seen?: string | null;
};
type FriendItem = { id: string; user: FriendUser; since: string };

const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_RESULTS = 20;

type FriendsTab = "friends" | "requests" | "discover";

export function FriendsContent() {
  const [tab, setTab] = useState<FriendsTab>("friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pendingIn, setPendingIn] = useState<FriendItem[]>([]);
  const [pendingOut, setPendingOut] = useState<FriendItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends ?? []);
      setPendingIn(data.pendingIncoming ?? []);
      setPendingOut(data.pendingOutgoing ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.users ?? []).slice(0, MAX_SEARCH_RESULTS));
      }
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  async function sendRequest(email: string) {
    setSentTo((prev) => new Set(prev).add(email));
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ friendEmail: email }),
    });
    if (res.ok) {
      fetchFriends();
    } else {
      setSentTo((prev) => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
    }
  }

  async function handleAction(friendshipId: string, action: "accept" | "reject") {
    if (action === "reject") {
      setRejected((prev) => new Set(prev).add(friendshipId));
    }
    await fetch("/api/friends", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    fetchFriends();
  }

  async function removeFriend(friendshipId: string) {
    if (!confirm("Remove this friend?")) return;
    await fetch("/api/friends", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ friendshipId }),
    });
    fetchFriends();
  }

  const visiblePendingIn = useMemo(() => pendingIn.filter((f) => !rejected.has(f.id)), [pendingIn, rejected]);
  const searchDelays = staggerDelays(searchResults.length, 50, searchResults.length);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[color:var(--color-text-secondary)]">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Users aria-hidden="true" size={24} /> Friends
      </h1>

      <Tabs
        tabs={[
          { id: "friends", label: `Friends (${friends.length})` },
          { id: "requests", label: `Requests (${visiblePendingIn.length})` },
          { id: "discover", label: "Discover" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as FriendsTab)}
        layoutId="friends-tabs-indicator"
        className="mb-6"
      />

      {tab === "friends" ? (
        friends.length === 0 ? (
          <EmptyState
            illustration={<Users aria-hidden="true" className="h-10 w-10" />}
            title="No friends yet"
            body="Search the Discover tab to find people and send a friend request."
            cta={{ label: "Add a Friend", href: "#" }}
          />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {friends.map((f) => {
                const online = f.user.last_seen ? isOnline(f.user.last_seen) : false;
                return (
                  <motion.li
                    key={f.id}
                    layoutId={`friend-${f.id}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                    className="flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={["h-2 w-2 rounded-full", online ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-text-tertiary)]"].join(" ")}
                      />
                      <div>
                        <p className="text-sm font-medium">{f.user?.name ?? "Unnamed"}</p>
                        <p className="text-xs text-[color:var(--color-text-tertiary)]">{f.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href="/party/create"
                        className="rounded-full bg-[color:var(--color-surface-3)] px-3 py-1 text-xs font-medium hover:bg-[color:var(--color-surface-4)]"
                      >
                        Invite to Watch Party
                      </a>
                      <button
                        onClick={() => removeFriend(f.id)}
                        className="text-xs text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-brand)]"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )
      ) : null}

      {tab === "requests" ? (
        <div className="space-y-6">
          {visiblePendingIn.length === 0 && pendingOut.length === 0 ? (
            <EmptyState
              illustration={<UserPlus aria-hidden="true" className="h-10 w-10" />}
              title="No pending requests"
              body="Requests you send or receive will show up here."
              cta={{ label: "Add a Friend", href: "#" }}
            />
          ) : (
            <>
              {visiblePendingIn.length > 0 ? (
                <section>
                  <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-text-secondary)]">
                    Friend requests ({visiblePendingIn.length})
                  </h2>
                  <ul className="space-y-2">
                    <AnimatePresence>
                      {visiblePendingIn.map((f) => (
                        <motion.li
                          key={f.id}
                          layoutId={`friend-${f.id}`}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                          className="flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-4 py-3"
                        >
                          <span className="text-sm">{f.user?.name ?? f.user?.email ?? "Unknown"}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(f.id, "accept")}
                              aria-label="Accept request"
                              className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-success)] text-white"
                            >
                              <Check aria-hidden="true" size={14} />
                            </button>
                            <button
                              onClick={() => handleAction(f.id, "reject")}
                              aria-label="Reject request"
                              className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface-3)]"
                            >
                              <span aria-hidden="true">✕</span>
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              ) : null}

              {pendingOut.length > 0 ? (
                <section>
                  <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-text-secondary)]">Sent requests</h2>
                  <ul className="space-y-1">
                    {pendingOut.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded-lg bg-[color:var(--color-surface-1)] px-3 py-2 text-sm">
                        <span>{f.user?.name ?? f.user?.email ?? "Unknown"}</span>
                        <span className="text-xs text-[color:var(--color-text-tertiary)]">Pending</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {tab === "discover" ? (
        <section>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-tertiary)]"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email…"
                aria-label="Search for people"
                className="h-10 w-full rounded-xl bg-[color:var(--color-surface-2)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
              />
            </div>
          </div>

          {searching ? (
            <p className="mt-3 text-xs text-[color:var(--color-text-tertiary)]">Searching…</p>
          ) : searchQuery.trim() && searchResults.length === 0 ? (
            <EmptyState
              illustration={<Search aria-hidden="true" className="h-10 w-10" />}
              title="No results"
              body={`No one found matching "${searchQuery.trim()}".`}
            />
          ) : (
            <ul className="mt-3 space-y-1">
              {searchResults.map((u, i) => {
                const pending = sentTo.has(u.email);
                return (
                  <motion.li
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: searchDelays[i] / 1000, duration: 0.2 }}
                    className="flex items-center justify-between rounded-lg bg-[color:var(--color-surface-2)] px-3 py-2 text-sm"
                  >
                    <span>{u.name ?? u.email}</span>
                    <motion.button
                      onClick={() => sendRequest(u.email)}
                      disabled={pending}
                      initial={false}
                      animate={pending ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        pending
                          ? "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-tertiary)]"
                          : "bg-[color:var(--color-brand)] text-white",
                      ].join(" ")}
                    >
                      {pending ? (
                        <span className="flex items-center gap-1">
                          <Check aria-hidden="true" size={12} /> Pending
                        </span>
                      ) : (
                        "Add"
                      )}
                    </motion.button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
