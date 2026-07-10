"use client";

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

export function MovieTable({ movies }: { movies: MovieRow[] }) {
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
