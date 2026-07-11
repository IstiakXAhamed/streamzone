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

/**
 * GET /api/series/ingest — list series for the admin page.
 * GET /api/series/ingest?seriesId=<id> — list episodes for one series.
 */
export async function GET(req: Request) {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const seriesId = new URL(req.url).searchParams.get("seriesId");

  if (seriesId) {
    const { data } = await supabaseAdmin
      .from("episodes")
      .select("id,season_number,episode_number,title,duration_seconds,created_at")
      .eq("series_id", seriesId)
      .order("season_number", { ascending: true })
      .order("episode_number", { ascending: true });
    return NextResponse.json({ episodes: data ?? [] });
  }

  const { data } = await supabaseAdmin
    .from("series")
    .select("id,title,slug,seasons_count,episodes_count,status,featured,is_public,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return NextResponse.json({ series: data ?? [] });
}

/**
 * DELETE /api/series/ingest
 * Admin-only. Two modes:
 *   { mode: 'series', id }            → delete a series and all its episodes
 *   { mode: 'episode', episodeId }    → delete one episode and fix series counters
 */
export async function DELETE(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const body = (await req.json().catch(() => null)) as
    | { mode?: string; id?: string; episodeId?: string }
    | null;
  if (!body?.mode) {
    return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  if (body.mode === "series") {
    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { data: series } = await supabaseAdmin
      .from("series")
      .select("id,title")
      .eq("id", body.id)
      .maybeSingle();
    if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });

    // Delete episodes first (watch_history rows referencing them cascade),
    // then the series itself — works regardless of FK cascade configuration.
    const { error: epErr } = await supabaseAdmin.from("episodes").delete().eq("series_id", body.id);
    if (epErr) return NextResponse.json({ error: epErr.message }, { status: 500 });

    const { error: delErr } = await supabaseAdmin.from("series").delete().eq("id", body.id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    await supabaseAdmin.from("admin_activity_log").insert({
      admin_user_id: user.id,
      action: "delete_series",
      target_id: body.id,
      metadata: { title: series.title },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.mode === "episode") {
    if (!body.episodeId) return NextResponse.json({ error: "episodeId is required" }, { status: 400 });

    const { data: episode } = await supabaseAdmin
      .from("episodes")
      .select("id,series_id,season_number,episode_number")
      .eq("id", body.episodeId)
      .maybeSingle();
    if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

    const { error: delErr } = await supabaseAdmin.from("episodes").delete().eq("id", body.episodeId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Recompute the parent series' counters from what remains.
    const { data: remaining } = await supabaseAdmin
      .from("episodes")
      .select("season_number")
      .eq("series_id", episode.series_id);
    const rows = remaining ?? [];
    const episodesCount = rows.length;
    const seasonsCount = rows.reduce((max, r) => Math.max(max, r.season_number ?? 0), 0);
    await supabaseAdmin
      .from("series")
      .update({ episodes_count: episodesCount, seasons_count: seasonsCount })
      .eq("id", episode.series_id);

    await supabaseAdmin.from("admin_activity_log").insert({
      admin_user_id: user.id,
      action: "delete_episode",
      target_id: episode.series_id,
      metadata: { season: episode.season_number, episode: episode.episode_number },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown mode" }, { status: 400 });
}
