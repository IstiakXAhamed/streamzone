import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AccessToken } from "livekit-server-sdk";

/**
 * POST /api/livekit/token
 * Generates a LiveKit room token for a party room.
 * Body: { roomId: string }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: urow } = await supabaseAdmin
    .from("users")
    .select("id,name,status")
    .ilike("email", session.user.email.toLowerCase())
    .maybeSingle();

  if (!urow || urow.status !== "approved") {
    return NextResponse.json({ error: "Not approved" }, { status: 403 });
  }

  const { roomId } = (await req.json()) as { roomId?: string };
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 });
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: urow.id,
    name: urow.name ?? session.user.email,
  });
  token.addGrant({
    room: `party-${roomId}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();
  return NextResponse.json({ token: jwt });
}
