import { supabaseAdmin } from "@/lib/supabase/admin";
import { DownloadsContent, type DownloadItem } from "./_components/DownloadsContent";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,poster_url,drive_file_id,drive_direct_link,created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const items: DownloadItem[] = (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    posterUrl: m.poster_url,
    fileSizeMb: null, // not tracked in the schema yet; UI gracefully shows "Size unknown"
    href: m.drive_direct_link ?? (m.drive_file_id ? `https://drive.google.com/uc?export=download&id=${m.drive_file_id}` : null),
    createdAt: m.created_at,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-heading">Downloads</h1>
      <p className="mb-6 max-w-prose text-sm text-[color:var(--color-text-secondary)]">
        Tap a title to open its Google Drive download link in a new tab. Transfers go
        directly from Drive — our server stays out of the byte path.
      </p>
      <DownloadsContent items={items} />
    </div>
  );
}
