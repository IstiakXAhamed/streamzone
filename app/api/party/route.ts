import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** POST /api/party — { movieId } → creates a watch-party room. Returns the new room id. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the user in our DB
  const { data: urow } = await supabaseAdmin
    .from("users")
    .select("id,status")
    .ilike("email", session.user.email.toLowerCase())
    .maybeSingle();

  if (!urow || urow.status !== "approved") {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const { movieId, friendsOnly } = (await req.json()) as { movieId?: string; friendsOnly?: boolean };
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  // Check if user already has a room for this movie
  const found = await supabaseAdmin
    .from("watch_party_rooms")
    .select("id")
    .eq("host_user_id", urow.id)
    .eq("movie_id", movieId)
    .maybeSingle();

  if (found.data?.id) return NextResponse.json({ roomId: found.data.id, created: false });

  const { data: row, error: err } = await supabaseAdmin
    .from("watch_party_rooms")
    .insert({ host_user_id: urow.id, movie_id: movieId, is_private: false, friends_only: friendsOnly ?? false })
    .select("id")
    .single();
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ roomId: row.id, created: true });
}

/** GET /api/party?mine=true → current user's active party rooms. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: urow } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("email", session.user.email.toLowerCase())
    .maybeSingle();

  if (!urow) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "true";

  let query = supabaseAdmin
    .from("watch_party_rooms")
    .select("id,host_user_id,movie_id,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (mine) query = query.eq("host_user_id", urow.id);

  const { data: rows } = await query;
  return NextResponse.json({ rooms: rows ?? [] });
}
