import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/party/invite — invite a friend to a party
 * Body: { roomId, friendUserId }
 *
 * GET /api/party/invite — get current user's pending party invitations
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("email", session.user.email.toLowerCase())
    .maybeSingle();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, friendUserId } = (await req.json()) as { roomId?: string; friendUserId?: string };
  if (!roomId || !friendUserId) return NextResponse.json({ error: "roomId and friendUserId required" }, { status: 400 });

  // Verify the room exists and user is the host
  const { data: room } = await supabaseAdmin
    .from("watch_party_rooms")
    .select("id,host_user_id")
    .eq("id", roomId)
    .maybeSingle();
  if (!room || room.host_user_id !== user.id) {
    return NextResponse.json({ error: "Not the host of this room" }, { status: 403 });
  }

  // Verify they are friends
  const { data: friendship } = await supabaseAdmin
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`)
    .maybeSingle();
  if (!friendship) return NextResponse.json({ error: "Not friends with this user" }, { status: 403 });

  // Create or update invitation
  const { error } = await supabaseAdmin
    .from("party_invitations")
    .upsert(
      { room_id: roomId, invited_user_id: friendUserId, invited_by: user.id, status: "pending" },
      { onConflict: "room_id,invited_user_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("email", session.user.email.toLowerCase())
    .maybeSingle();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invites } = await supabaseAdmin
    .from("party_invitations")
    .select("id,room_id,invited_by,status,created_at,users!party_invitations_invited_by_fkey(name,email)")
    .eq("invited_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return NextResponse.json({ invitations: invites ?? [] });
}
