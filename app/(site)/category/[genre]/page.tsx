import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface GenrePageProps { params: Promise<{ genre: string }>; }

export async function generateMetadata({ params }: GenrePageProps) {
  const { genre } = await params;
  return { title: `${genre} movies · MovieZone` };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { genre } = await params;
  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,year,poster_url")
    .eq("is_public", true)
    .contains("genre", [genre])
    .order("views_count", { ascending: false })
    .limit(40);

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-4 text-2xl font-bold capitalize">{genre}</h1>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {data.map((m) => (
          <li key={m.id}>
            <Link href={`/movie/${m.slug}`} className="block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.poster_url && <img src={m.poster_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="mt-1 line-clamp-1 text-sm">{m.title}</p>
              {m.year && <p className="text-xs text-[color:var(--color-text-tertiary)]">{m.year}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
