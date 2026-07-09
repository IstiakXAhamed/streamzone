import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/friends — list current user's friends (accepted) and pending requests
 * POST /api/friends — send a friend request { friendEmail }
 * PATCH /api/friends — accept/reject a request { friendshipId, action: "accept"|"reject" }
 * DELETE /api/friends — remove a friend { friendshipId }
 */

async function getUser(session: any) {
  if (!session?.user?.email) return null;
  const { data } = await supabaseAdmin
    .from("users")
    .select("id,email,name")
    .ilike("email", session.user.email.toLowerCase())
    .maybeSingle();
  return data;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = await getUser(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get accepted friends (both directions)
  const { data: sent } = await supabaseAdmin
    .from("friendships")
    .select("id,friend_id,status,created_at,users!friendships_friend_id_fkey(id,name,email,avatar_url)")
    .eq("user_id", user.id)
    .eq("status", "accepted");

  const { data: received } = await supabaseAdmin
    .from("friendships")
    .select("id,user_id,status,created_at,users!friendships_user_id_fkey(id,name,email,avatar_url)")
    .eq("friend_id", user.id)
    .eq("status", "accepted");

  // Get pending requests TO this user
  const { data: pending } = await supabaseAdmin
    .from("friendships")
    .select("id,user_id,status,created_at,users!friendships_user_id_fkey(id,name,email,avatar_url)")
    .eq("friend_id", user.id)
    .eq("status", "pending");

  // Get pending requests FROM this user
  const { data: outgoing } = await supabaseAdmin
    .from("friendships")
    .select("id,friend_id,status,created_at,users!friendships_friend_id_fkey(id,name,email,avatar_url)")
    .eq("user_id", user.id)
    .eq("status", "pending");

  const friends = [
    ...(sent ?? []).map((f: any) => ({ id: f.id, user: f.users, since: f.created_at })),
    ...(received ?? []).map((f: any) => ({ id: f.id, user: f.users, since: f.created_at })),
  ];

  return NextResponse.json({
    friends,
    pendingIncoming: (pending ?? []).map((f: any) => ({ id: f.id, user: f.users, since: f.created_at })),
    pendingOutgoing: (outgoing ?? []).map((f: any) => ({ id: f.id, user: f.users, since: f.created_at })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await getUser(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendEmail } = (await req.json()) as { friendEmail?: string };
  if (!friendEmail) return NextResponse.json({ error: "friendEmail required" }, { status: 400 });

  const { data: friendUser } = await supabaseAdmin
    .from("users")
    .select("id,email")
    .ilike("email", friendEmail.toLowerCase().trim())
    .maybeSingle();

  if (!friendUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (friendUser.id === user.id) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

  // Check if friendship already exists in either direction
  const { data: existing } = await supabaseAdmin
    .from("friendships")
    .select("id,status")
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") return NextResponse.json({ error: "Already friends" }, { status: 409 });
    if (existing.status === "pending") return NextResponse.json({ error: "Request already pending" }, { status: 409 });
  }

  const { data: row, error } = await supabaseAdmin
    .from("friendships")
    .insert({ user_id: user.id, friend_id: friendUser.id, status: "pending" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, friendshipId: row.id });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await getUser(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendshipId, action } = (await req.json()) as { friendshipId?: string; action?: "accept" | "reject" };
  if (!friendshipId || !action) return NextResponse.json({ error: "friendshipId and action required" }, { status: 400 });

  // Only the recipient can accept/reject
  const { data: friendship } = await supabaseAdmin
    .from("friendships")
    .select("id,friend_id,status")
    .eq("id", friendshipId)
    .eq("friend_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (action === "accept") {
    await supabaseAdmin
      .from("friendships")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", friendshipId);
    return NextResponse.json({ ok: true, status: "accepted" });
  } else {
    await supabaseAdmin.from("friendships").delete().eq("id", friendshipId);
    return NextResponse.json({ ok: true, status: "rejected" });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await getUser(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendshipId } = (await req.json()) as { friendshipId?: string };
  if (!friendshipId) return NextResponse.json({ error: "friendshipId required" }, { status: 400 });

  // User can remove friendship in either direction
  await supabaseAdmin
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  return NextResponse.json({ ok: true });
}
