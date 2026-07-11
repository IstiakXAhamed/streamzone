"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";

interface MovieRow {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  genre: string[];
  views_count: number;
  featured: boolean;
  is_public: boolean;
  created_at: string;
}

function DeleteMovieButton({ movie, onDeleted }: { movie: MovieRow; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${movie.title}"? This removes it from the catalogue and cannot be undone. (The Drive file itself is not deleted.)`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/movies/ingest", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: movie.id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        alert(body.error ?? "Failed to delete movie");
        return;
      }
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      aria-label={`Delete ${movie.title}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-tertiary)] transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}

export function MovieTable({ movies }: { movies: MovieRow[] }) {
  const router = useRouter();

  const columns: DataTableColumn<MovieRow>[] = [
    {
      key: "title",
      header: "Title",
      sortValue: (m) => m.title.toLowerCase(),
      render: (m) => (
        <>
          <p className="font-medium text-white">{m.title}</p>
          <p className="text-xs text-[color:var(--color-text-tertiary)]">{m.slug}</p>
        </>
      ),
    },
    {
      key: "genre",
      header: "Genre",
      hideBelow: "lg",
      render: (m) => <span className="text-xs text-[color:var(--color-text-secondary)]">{m.genre.slice(0, 3).join(", ")}</span>,
    },
    {
      key: "year",
      header: "Year",
      hideBelow: "md",
      sortValue: (m) => m.year ?? 0,
      render: (m) => m.year ?? "—",
    },
    {
      key: "views_count",
      header: "Views",
      hideBelow: "md",
      align: "right",
      sortValue: (m) => m.views_count,
      render: (m) => m.views_count,
    },
    {
      key: "flags",
      header: "Flags",
      align: "right",
      render: (m) => (
        <span className="inline-flex gap-1">
          {m.featured ? <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">featured</span> : null}
          {!m.is_public ? (
            <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs text-[color:var(--color-text-secondary)]">draft</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => <DeleteMovieButton movie={m} onDeleted={() => router.refresh()} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={movies}
      getRowKey={(m) => m.id}
      emptyMessage='No movies yet. Click "Add movie" to ingest your first title from Drive.'
    />
  );
}
