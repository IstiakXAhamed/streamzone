import { supabaseAdmin } from "@/lib/supabase/admin";
import { MovieTable } from "./_components/MovieTable";
import { IngestMovieButton } from "./_components/IngestMovieButton";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage() {
  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,year,genre,views_count,featured,is_public,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const movies = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movies</h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Add titles that live in your Google Drive. We never proxy the bytes —
            your admin panel only stores metadata.
          </p>
        </div>
        <IngestMovieButton />
      </div>

      <MovieTable movies={movies} />
    </div>
  );
}
