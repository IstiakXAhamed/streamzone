import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { SavedMoviesContent } from "./_components/SavedMoviesContent";

export default async function SavedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.status === "pending") redirect("/pending");

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("saved_offline")
    .select("movie_id, saved_at, movie:movies(id,title,poster_url,year,rating,genre)")
    .eq("user_id", session.user.id)
    .order("saved_at", { ascending: false })
    .limit(100);

  const saved = (rows ?? []).map((r) => {
    const m = r.movie as unknown as {
      id?: string;
      title?: string;
      poster_url?: string;
      year?: number | null;
      rating?: number | null;
      genre?: string[] | null;
    } | null;
    return {
      id: r.movie_id,
      savedAt: r.saved_at,
      posterUrl: m?.poster_url ?? null,
      title: m?.title,
      year: m?.year ?? null,
      rating: m?.rating ?? null,
      genres: m?.genre ?? null,
    };
  });
  const titleById = new Map(saved.map((s) => [s.id, { title: s.title }]));

  return <SavedMoviesContent initialSaved={saved} titleById={titleById} />;
}
