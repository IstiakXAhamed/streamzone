"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Check, X, Search, Users } from "lucide-react";

type FriendUser = { id: string; name: string | null; email: string; avatar_url: string | null };
type FriendItem = { id: string; user: FriendUser; since: string };

export function FriendsContent() {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pendingIn, setPendingIn] = useState<FriendItem[]>([]);
  const [pendingOut, setPendingOut] = useState<FriendItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.users ?? []);
    }
    setSearching(false);
  }

  async function sendRequest(email: string) {
    setAddStatus(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ friendEmail: email }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddStatus("Request sent!");
      setAddEmail("");
      fetchFriends();
    } else {
      setAddStatus(data.error ?? "Failed");
    }
  }

  async function handleAction(friendshipId: string, action: "accept" | "reject") {
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

  if (loading) return <div className="p-8 text-center text-sm text-[color:var(--color-text-secondary)]">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Users size={24} /> Friends
      </h1>

      {/* Add friend */}
      <section className="mt-6 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
        <h2 className="mb-2 text-sm font-semibold">Add a friend</h2>
        <div className="flex gap-2">
          <input
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="Enter email address"
            className="h-10 flex-1 rounded-xl bg-[color:var(--color-surface-2)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          />
          <button
            onClick={() => sendRequest(addEmail)}
            disabled={!addEmail.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[color:var(--color-brand)] px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            <UserPlus size={14} /> Send
          </button>
        </div>
        {addStatus && <p className="mt-2 text-xs text-emerald-400">{addStatus}</p>}

        {/* Search */}
        <div className="mt-3 flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name or email..."
            className="h-9 flex-1 rounded-lg bg-[color:var(--color-surface-2)] px-3 text-sm outline-none"
          />
          <button onClick={handleSearch} disabled={searching} className="rounded-lg bg-[color:var(--color-surface-3)] px-3">
            <Search size={14} />
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 space-y-1">
            {searchResults.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-lg bg-[color:var(--color-surface-2)] px-3 py-2 text-sm">
                <span>{u.name ?? u.email}</span>
                <button
                  onClick={() => sendRequest(u.email)}
                  className="rounded-full bg-[color:var(--color-brand)] px-2 py-0.5 text-xs text-white"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending incoming */}
      {pendingIn.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-text-secondary)]">
            Friend requests ({pendingIn.length})
          </h2>
          <ul className="space-y-2">
            {pendingIn.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-4 py-3">
                <span className="text-sm">{f.user?.name ?? f.user?.email ?? "Unknown"}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(f.id, "accept")} className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white"><Check size={14} /></button>
                  <button onClick={() => handleAction(f.id, "reject")} className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface-3)]"><X size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pending outgoing */}
      {pendingOut.length > 0 && (
        <section className="mt-6">
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
      )}

      {/* Friends list */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-text-secondary)]">
          Your friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-[color:var(--color-text-tertiary)]">No friends yet. Add someone above!</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{f.user?.name ?? "Unnamed"}</p>
                  <p className="text-xs text-[color:var(--color-text-tertiary)]">{f.user?.email}</p>
                </div>
                <button onClick={() => removeFriend(f.id)} className="text-xs text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-brand)]">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
