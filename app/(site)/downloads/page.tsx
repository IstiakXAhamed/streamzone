import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,drive_file_id,drive_direct_link")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const movies = data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Downloads</h1>
      <p className="mb-6 max-w-prose text-sm text-[color:var(--color-text-secondary)]">
        Tap a title to open its Google Drive download link in a new tab. Transfers go
        directly from Drive — our server stays out of the byte path.
      </p>

      <ul className="space-y-2">
        {movies.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
            <div className="flex items-center gap-3">
              <span className="line-clamp-1 text-sm font-medium">{m.title}</span>
            </div>
            <a
              className="rounded-full bg-[color:var(--color-surface-3)] px-3 py-1.5 text-xs font-medium"
              href={m.drive_direct_link ?? `https://drive.google.com/uc?export=download&id=${m.drive_file_id}`}
              target="_blank"
              rel="noreferrer"
            >
              ⬇ Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
