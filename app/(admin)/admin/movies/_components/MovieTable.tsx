"use client";

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
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)]">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--color-surface-2)] text-[color:var(--color-text-tertiary)]">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="hidden px-4 py-3 text-left lg:table-cell">Genre</th>
            <th className="hidden px-4 py-3 text-left md:table-cell">Year</th>
            <th className="hidden px-4 py-3 text-right md:table-cell">Views</th>
            <th className="px-4 py-3 text-right">Flags</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
          {movies.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--color-text-tertiary)]">
                No movies yet. Click “Add movie” to ingest your first title from Drive.
              </td>
            </tr>
          )}
          {movies.map((m) => (
            <tr key={m.id} className="hover:bg-[color:var(--color-surface-2)]/40">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{m.title}</p>
                <p className="text-xs text-[color:var(--color-text-tertiary)]">{m.slug}</p>
              </td>
              <td className="hidden px-4 py-3 text-xs text-[color:var(--color-text-secondary)] lg:table-cell">
                {m.genre.slice(0, 3).join(", ")}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">{m.year ?? "—"}</td>
              <td className="hidden px-4 py-3 text-right md:table-cell">{m.views_count}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex gap-1">
                  {m.featured && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                      featured
                    </span>
                  )}
                  {!m.is_public && (
                    <span className="rounded-full bg-[color:var(--color-surface-3)] px-2 py-0.5 text-xs text-[color:var(--color-text-secondary)]">
                      draft
                    </span>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
