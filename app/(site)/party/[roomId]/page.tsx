import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PartyRoomClient } from "./_components/PartyRoomClient";

export const dynamic = "force-dynamic";

export default async function PartyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const sb = await createServerClient();
  const room = await supabaseAdmin
    .from("watch_party_rooms")
    .select("id,host_user_id,movie_id,created_at")
    .eq("id", roomId)
    .maybeSingle();
  if (!room.data) notFound();

  const movie = await supabaseAdmin
    .from("movies")
    .select("id,title,poster_url,backdrop_url,slug,drive_file_id")
    .eq("id", room.data.movie_id)
    .maybeSingle();

  const { data: authUser } = await sb.auth.getUser();
  let participant: { name?: string | null; status?: string | null } | null = null;
  if (authUser.user) {
    const { data } = await sb.from("users").select("id,name,role,status").eq("id", authUser.user.id).maybeSingle();
    participant = data ? { name: data.name, status: data.status } : null;
  }

  return (
    <PartyRoomClient
      roomId={roomId}
      movieId={room.data.movie_id}
      initialMovieTitle={movie.data?.title ?? "Party"}
      hostUserId={room.data.host_user_id}
      identityId={authUser.user?.id ?? null}
      identityName={participant?.name ?? authUser.user?.email ?? "guest"}
      identityStatus={participant?.status ?? null}
    />
  );
}
