import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/friends/search?q=query
 * Searches users by name or email (for adding friends).
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id,name,email,avatar_url")
    .eq("status", "approved")
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .neq("email", session.user.email.toLowerCase())
    .limit(10);

  return NextResponse.json({ users: data ?? [] });
}
