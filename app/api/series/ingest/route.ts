import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/requireRole";
import {
  seriesIngestSchema,
  episodeIngestSchema,
  type SeriesIngestInput,
  type EpisodeIngestInput,
} from "@/lib/validators";

/**
 * POST /api/series/ingest
 * Admin-only. Two modes:
 *   mode: 'series'  → create a series row (metadata only)
 *   mode: 'episode' → append an episode to a series and bump counters
 */
export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const body = (await req.json().catch(() => null)) as { mode?: string } | null;
  if (!body || !body.mode) {
    return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  if (body.mode === "series") {
    const parsed = seriesIngestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data as SeriesIngestInput;
    const slug =
      input.slug ??
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
      genre: input.genre ?? [],
      poster_url: input.posterDriveFileId
        ? `https://drive.google.com/thumbnail?id=${input.posterDriveFileId}&sz=w800`
        : null,
      backdrop_url: input.backdropDriveFileId
        ? `https://drive.google.com/thumbnail?id=${input.backdropDriveFileId}&sz=w1280`
        : null,
      status: input.status ?? "ongoing",
      is_public: input.isPublic ?? true,
      created_by: user.id,
    };

    const { data, error: upsertErr } = await supabaseAdmin
      .from("series")
      .upsert(row, { onConflict: "slug" })
      .select("*")
      .single();
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    await supabaseAdmin.from("admin_activity_log").insert({
      admin_user_id: user.id,
      action: "ingest_series",
      target_id: data.id,
      metadata: { slug },
    });
    return NextResponse.json({ ok: true, series: data });
  }

  if (body.mode === "episode") {
    const parsed = episodeIngestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data as EpisodeIngestInput;

    // parent must exist
    const { data: parent } = await supabaseAdmin
      .from("series")
      .select("id,seasons_count,episodes_count")
      .eq("id", input.seriesId)
      .maybeSingle();
    if (!parent) return NextResponse.json({ error: "Series not found" }, { status: 404 });

    const { error: insErr } = await supabaseAdmin.from("episodes").insert({
      series_id: input.seriesId,
      season_number: input.seasonNumber,
      episode_number: input.episodeNumber,
      title: input.title,
      description: input.description ?? null,
      duration_seconds: input.durationSeconds ?? null,
      drive_file_id: input.driveFileId,
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    // bump counters
    const newSeasonsCount = Math.max(parent.seasons_count ?? 0, input.seasonNumber);
    await supabaseAdmin
      .from("series")
      .update({
        episodes_count: (parent.episodes_count ?? 0) + 1,
        seasons_count: newSeasonsCount,
      })
      .eq("id", input.seriesId);

    await supabaseAdmin.from("admin_activity_log").insert({
      admin_user_id: user.id,
      action: "ingest_episode",
      target_id: input.seriesId,
      metadata: { season: input.seasonNumber, episode: input.episodeNumber },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown mode" }, { status: 400 });
}

/** GET /api/series/ingest — list series for the admin page. */
export async function GET() {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const { data } = await supabaseAdmin
    .from("series")
    .select("id,title,slug,seasons_count,episodes_count,status,featured,is_public,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return NextResponse.json({ series: data ?? [] });
}
