import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/authOptions";

/** GET /api/me/history/:movieId — resume position for a single movie. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ movieId: string }> },
) {
  const { movieId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { data: u } = await supabase.from("users").select("id").ilike("email", session.user.email).maybeSingle();
  if (!u) return NextResponse.json({ position: 0 });

  const { data: row } = await supabase
    .from("watch_history")
    .select("position_seconds")
    .eq("user_id", u.id)
    .eq("movie_id", movieId)
    .maybeSingle();
  return NextResponse.json({ position: row?.position_seconds ?? 0 });
}
