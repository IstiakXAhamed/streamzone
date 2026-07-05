import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** POST /api/party — { movieId } → creates a watch-party room. Returns the new room id. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: urow } = await supabase.from("users").select("status").eq("id", data.user.id).single();
  if (!urow || urow.status !== "approved") return NextResponse.json({ error: "Account not approved" }, { status: 403 });

  const { movieId } = (await req.json()) as { movieId?: string };
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  // upsert a single host===user room for that movie
  const found = await supabaseAdmin
    .from("watch_party_rooms")
    .select("id")
    .eq("host_user_id", data.user.id)
    .eq("movie_id", movieId)
    .maybeSingle();

  if (found.data?.id) return NextResponse.json({ roomId: found.data.id, created: false });

  const { data: row, error: err } = await supabaseAdmin
    .from("watch_party_rooms")
    .insert({ host_user_id: data.user.id, movie_id: movieId, is_private: false })
    .select("id")
    .single();
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ roomId: row.id, created: true });
}

/** GET /api/party?mine=true → current user's active party rooms. */
export async function GET(req: Request) {
  const sb = await createClient();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "true";

  let query = supabaseAdmin
    .from("watch_party_rooms")
    .select("id,host_user_id,movie_id,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (mine) query = query.eq("host_user_id", data.user.id);

  const { data: rows } = await query;
  return NextResponse.json({ rooms: rows ?? [] });
}
