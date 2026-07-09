import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PartyRoomClient } from "./_components/PartyRoomClient";

export const dynamic = "force-dynamic";

export default async function PartyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const room = await supabaseAdmin
    .from("watch_party_rooms")
    .select("id,host_user_id,movie_id,created_at,friends_only")
    .eq("id", roomId)
    .maybeSingle();
  if (!room.data) notFound();

  const movie = await supabaseAdmin
    .from("movies")
    .select("id,title,poster_url,backdrop_url,slug,drive_file_id")
    .eq("id", room.data.movie_id)
    .maybeSingle();

  // Use NextAuth session (not Supabase Auth)
  const session = await getServerSession(authOptions);
  let identityId: string | null = null;
  let identityName = "guest";
  let identityStatus: string | null = null;

  if (session?.user?.email) {
    const { data: urow } = await supabaseAdmin
      .from("users")
      .select("id,name,status")
      .ilike("email", session.user.email.toLowerCase())
      .maybeSingle();
    if (urow) {
      identityId = urow.id;
      identityName = urow.name ?? session.user.name ?? session.user.email;
      identityStatus = urow.status;
    }
  }

  // Friends-only check: if room is friends_only, verify the joiner is friends with host
  if (room.data.friends_only && identityId && identityId !== room.data.host_user_id) {
    const { data: friendship } = await supabaseAdmin
      .from("friendships")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(user_id.eq.${identityId},friend_id.eq.${room.data.host_user_id}),and(user_id.eq.${room.data.host_user_id},friend_id.eq.${identityId})`
      )
      .maybeSingle();

    if (!friendship) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold">Friends Only</h2>
            <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
              This watch party is restricted to the host&apos;s friends.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <PartyRoomClient
      roomId={roomId}
      movieId={room.data.movie_id}
      initialMovieTitle={movie.data?.title ?? "Party"}
      hostUserId={room.data.host_user_id}
      identityId={identityId}
      identityName={identityName}
      identityStatus={identityStatus}
    />
  );
}
