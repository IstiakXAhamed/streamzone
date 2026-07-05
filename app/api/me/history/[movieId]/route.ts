import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/me/history/:movieId — resume position for a single movie. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ movieId: string }> },
) {
  const { movieId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: row } = await supabase
    .from("watch_history")
    .select("position_seconds")
    .eq("user_id", data.user.id)
    .eq("movie_id", movieId)
    .maybeSingle();
  return NextResponse.json({ position: row?.position_seconds ?? 0 });
}
