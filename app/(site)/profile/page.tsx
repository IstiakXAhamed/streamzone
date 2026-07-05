import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <div className="grid min-h-screen place-items-center bg-black"><Link href="/login" className="rounded-full bg-[color:var(--color-brand)] px-5 py-2 text-white">Sign in</Link></div>;

  const sb = await createClient();
  const { data: history } = await sb
    .from("watch_history")
    .select("movie_id, position_seconds, watched_at, movie:movies(id,title,slug,poster_url)")
    .eq("user_id", session.user.id)
    .order("watched_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <header className="mb-6 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-[color:var(--color-surface-2)] text-2xl font-bold">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-full w-full object-cover" />
          ) : (session.user.name?.[0] ?? session.user.email?.[0] ?? "U")}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{session.user.name ?? "Your profile"}</h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            {session.user.email} · role <strong className="uppercase">{session.user.role}</strong>
          </p>
        </div>
        <button onClick={() => signOut()} className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-3)] px-3 py-2 text-sm">Sign out <LogOut size={14} /></button>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Continue watching</h2>
        <div className="mz-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {!history || history.length === 0 ? (
            <p className="p-2 text-sm text-[color:var(--color-text-tertiary)]">You haven&apos;t watched anything yet.</p>
          ) : history.map((h) => {
            const m = h.movie as unknown as { title?: string; slug?: string; poster_url?: string } | null;
            return (
              <Link key={h.movie_id} href={`/watch/${h.movie_id}`} className="mz-snap-start flex w-36 shrink-0 flex-col gap-1 sm:w-44">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m?.poster_url && <img src={m.poster_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <p className="line-clamp-1 text-sm">{m?.title ?? h.movie_id}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
