import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ProfileContent } from "./_components/ProfileContent";
import { continueWatching, type ContinueWatchingEntry } from "@/lib/ui/watch-stats";

export const dynamic = "force-dynamic";

interface HistoryRow {
  movie_id: string;
  position_seconds: number;
  watched_at: string;
  movie: { id?: string; title?: string; slug?: string; poster_url?: string; duration_seconds?: number; genre?: string[] } | null;
}

interface ProfileContinueWatchingEntry extends ContinueWatchingEntry {
  slug: string;
  posterUrl: string | null;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="grid min-h-screen place-items-center bg-black">
        <Link href="/login" className="rounded-full bg-[color:var(--color-brand)] px-5 py-2 text-white">
          Sign in
        </Link>
      </div>
    );
  }

  const sb = await createClient();
  const { data } = await sb
    .from("watch_history")
    .select("movie_id, position_seconds, watched_at, movie:movies(id,title,slug,poster_url,duration_seconds,genre)")
    .eq("user_id", session.user.id)
    .order("watched_at", { ascending: false })
    .limit(200);

  const history = (data ?? []) as unknown as HistoryRow[];

  const watchStatsEntries = history.map((h) => ({
    movieId: h.movie_id,
    positionSeconds: h.position_seconds,
    durationSeconds: h.movie?.duration_seconds ?? 0,
    watchedAt: h.watched_at,
    genres: h.movie?.genre ?? [],
  }));

  const continueWatchingEntries: ProfileContinueWatchingEntry[] = history
    .filter((h) => h.movie)
    .map((h) => ({
      movieId: h.movie_id,
      title: h.movie!.title ?? h.movie_id,
      positionSeconds: h.position_seconds,
      durationSeconds: h.movie?.duration_seconds ?? 0,
      watchedAt: h.watched_at,
      genres: h.movie?.genre ?? [],
      slug: h.movie!.slug ?? "",
      posterUrl: h.movie!.poster_url ?? null,
    }));

  const inProgress = continueWatching(continueWatchingEntries);

  const continueWatchingCards = inProgress.map((entry) => ({
    id: entry.movieId,
    title: entry.title,
    slug: entry.slug,
    poster_url: entry.posterUrl,
    backdrop_url: null,
    year: null,
    rating: null,
    duration_seconds: entry.durationSeconds,
    watch_position_seconds: entry.positionSeconds,
  }));

  return (
    <ProfileContent
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role: session.user.role ?? "user",
        createdAt: null,
      }}
      watchHistory={watchStatsEntries}
      continueWatchingCards={continueWatchingCards}
    />
  );
}
