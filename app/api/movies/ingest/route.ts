import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/requireRole";
import { movieIngestSchema } from "@/lib/validators";

/**
 * POST /api/movies/ingest
 * Admin-only. Creates or updates a `movies` row pointing at a Drive file.
 * Body is validated with movieIngestSchema; slug defaults from title when absent.
 *
 * The caller supplies Drive file IDs (the video, poster, backdrop,
 * trailer) — bytes never touch this server. Resolution to viewable URLs
 * happens on the fly in /api/stream/:movieId + in the frontend via the Drive
 * thumbnail service.
 */
export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = movieIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  // derive slug from title if caller didn't provide one
  const slug =
    (body as { slug?: string }).slug ??
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 200);

  const row = {
    title: input.title,
    slug,
    description: input.description ?? null,
    year: input.year ?? null,
    duration_seconds: input.durationSeconds ?? null,
    genre: input.genre ?? [],
    poster_url: input.posterDriveFileId
      ? `https://drive.google.com/thumbnail?id=${input.posterDriveFileId}&sz=w800`
      : null,
    backdrop_url: input.backdropDriveFileId
      ? `https://drive.google.com/thumbnail?id=${input.backdropDriveFileId}&sz=w1280`
      : null,
    drive_file_id: input.driveFileId,
    trailer_drive_file_id: input.trailerDriveFileId ?? null,
    rating: input.rating ?? null,
    featured: input.featured ?? false,
    is_public: input.isPublic ?? true,
    created_by: user.id || null,
  };

  const { data, error: upsertErr } = await supabaseAdmin
    .from("movies")
    .upsert(row, { onConflict: "slug" })
    .select("*")
    .single();
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  await supabaseAdmin.from("admin_activity_log").insert({
    admin_user_id: user.id || null,
    action: "ingest_movie",
    target_id: data.id,
    metadata: { slug },
  });

  return NextResponse.json({ ok: true, movie: data });
}

/** GET /api/movies/ingest — lightweight recent list, admin-only. */
export async function GET() {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ movies: data ?? [] });
}
