import { supabaseAdmin } from "@/lib/supabase/admin";
import type { MovieRow } from "@/types/db";

async function getFeatured(): Promise<MovieRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("movies")
      .select("*")
      .order("featured", { ascending: false })
      .order("views_count", { ascending: false })
      .limit(10);
    if (error) return [];
    return (data ?? []) as MovieRow[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeatured();
  const hasMovies = featured.length > 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      {!hasMovies ? (
        <section className="flex min-h-[60vh] flex-col justify-center gap-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Welcome to <span className="text-[color:var(--color-brand)]">MovieZone</span>
          </h1>
          <p className="mx-auto max-w-prose text-[color:var(--color-text-secondary)]">
            Your private movie hub is ready. Once the first movie is ingested
            from Google Drive, the homepage will come alive with hero carousels,
            continue-watch, and trending rows — every one of them tuned for the
            phone you&apos;re holding right now.
          </p>
          <div className="mt-6 rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)]/60 p-6 text-left text-sm">
            <p className="font-semibold text-white">Setup checklist</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[color:var(--color-text-secondary)]">
              <li>
                Copy <code className="text-[color:var(--color-brand)]">.env.local.example</code> to{" "}
                <code className="text-[color:var(--color-brand)]">.env.local</code> and fill in
                your Supabase + Drive credentials.
              </li>
              <li>
                Run the database migration that creates{" "}
                <code className="text-[color:var(--color-brand)]">users</code>,{" "}
                <code className="text-[color:var(--color-brand)]">movies</code>, and{" "}
                <code className="text-[color:var(--color-brand)]">watch_history</code>.
              </li>
              <li>
                Pull up <code className="text-[color:var(--color-brand)]">/api/smoke</code> to
                verify backend reachability.
              </li>
              <li>
                Log in as your configured superadmin and head to{" "}
                <code className="text-[color:var(--color-brand)]">/admin/movies</code> to ingest
                the first title.
              </li>
            </ul>
          </div>
        </section>
      ) : (
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight">Featured</h2>
          <p className="text-[color:var(--color-text-secondary)]">
            Movies will render here once Phase 1 wires the carousels.
          </p>
        </section>
      )}
    </main>
  );
}
