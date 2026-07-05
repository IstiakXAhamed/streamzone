import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId } = (await req.json()) as { movieId?: string };
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  await supabase
    .from("saved_offline")
    .delete()
    .eq("user_id", data.user.id)
    .eq("movie_id", movieId);

  return NextResponse.json({ ok: true });
}
