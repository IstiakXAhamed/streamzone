"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function CreatePartyContent(
  { movies }: { movies: { id: string; title: string; slug: string; poster_url: string | null }[] }
) {
  const router = useRouter();
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createRoom() {
    if (!selectedMovieId) return;
    setBusy(true);
    const res = await fetch("/api/party", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ movieId: selectedMovieId }),
    });
    const body = (await res.json()) as { roomId?: string; error?: string };
    setBusy(false);
    if (!body.roomId) {
      alert(body.error ?? "Failed to create room");
      return;
    }
    router.push(`/party/${body.roomId}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[color:var(--color-brand)]">
        <ArrowLeft size={14} /> Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Start a Watch Party</h1>
      <p className="mb-4 text-sm text-[color:var(--color-text-secondary)]">
        Pick a movie. A short share code will be generated that friends can use to join and watch in sync.
      </p>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {movies.map((m) => {
          const active = m.id === selectedMovieId;
          return (
            <li
              key={m.id}
              onClick={() => setSelectedMovieId(m.id)}
              className={`cursor-pointer rounded-xl border p-2 transition ${
                active ? "border-[color:var(--color-brand)]" : "border-[color:var(--color-border-subtle)]"
              }`}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[color:var(--color-surface-2)]">
                {m.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.poster_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <p className="mt-1 line-clamp-1 text-xs">{m.title}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center gap-3">
        <button
          disabled={!selectedMovieId || busy}
          onClick={createRoom}
          className="rounded-full bg-[color:var(--color-brand)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create party"}
        </button>
        <span className="text-xs text-[color:var(--color-text-tertiary)]">
          Selected: {movies.find((m) => m.id === selectedMovieId)?.title ?? "none"}
        </span>
      </div>
    </div>
  );
}
