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
    .select("id,host_user_id,movie_id,episode_id,created_at,friends_only")
    .eq("id", roomId)
    .maybeSingle();
  if (!room.data) notFound();

  // A room targets either a movie or a series episode. Resolve the title,
  // poster, and the correct stream endpoint for whichever it is.
  let mediaTitle = "Party";
  let mediaPoster: string | null = null;
  let streamUrl = "";

  if (room.data.episode_id) {
    const { data: episode } = await supabaseAdmin
      .from("episodes")
      .select("id,title,series_id,still_url")
      .eq("id", room.data.episode_id)
      .maybeSingle();
    if (episode) {
      const { data: parentSeries } = await supabaseAdmin
        .from("series")
        .select("title,poster_url")
        .eq("id", episode.series_id)
        .maybeSingle();
      mediaTitle = parentSeries?.title ? `${parentSeries.title} — ${episode.title}` : episode.title;
      mediaPoster = episode.still_url ?? parentSeries?.poster_url ?? null;
      streamUrl = `/api/stream/episode/${episode.id}`;
    }
  } else if (room.data.movie_id) {
    const { data: movie } = await supabaseAdmin
      .from("movies")
      .select("id,title,poster_url,backdrop_url,slug,drive_file_id")
      .eq("id", room.data.movie_id)
      .maybeSingle();
    mediaTitle = movie?.title ?? "Party";
    mediaPoster = movie?.poster_url ?? null;
    streamUrl = `/api/stream/${room.data.movie_id}`;
  }

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
      mediaId={room.data.episode_id ?? room.data.movie_id}
      streamUrl={streamUrl}
      initialMovieTitle={mediaTitle}
      poster={mediaPoster}
      hostUserId={room.data.host_user_id}
      identityId={identityId}
      identityName={identityName}
      identityStatus={identityStatus}
    />
  );
}
