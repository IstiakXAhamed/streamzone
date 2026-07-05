import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { WatchContent } from "./_components/WatchContent";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: movieId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.status !== "approved") redirect("/pending");

  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,poster_url,slug,is_public")
    .eq("id", movieId)
    .eq("is_public", true)
    .maybeSingle();

  if (!data) redirect("/");
  const movie = data as { id: string; title: string; slug?: string | null; poster_url?: string | null };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex h-14 items-center gap-2 bg-black/70 px-4">
        <Link href="/" className="text-sm font-semibold text-[color:var(--color-brand)]">← Home</Link>
        <span className="truncate text-sm">{movie.title}</span>
      </header>
      <WatchContent movieId={movie.id} defaultPoster={movie.poster_url ?? null} defaultTitle={movie.title} movie={{ slug: movie.slug ?? movie.id, id: movie.id }} />
    </div>
  );
}
