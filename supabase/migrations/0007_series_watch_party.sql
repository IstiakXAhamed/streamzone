-- Watch-party support for series episodes.
-- Previously watch_party_rooms.movie_id was NOT NULL and only referenced movies,
-- so parties could only be created for movies. This lets a room target either a
-- movie OR a series episode.

-- Allow movie_id to be null (episode-based rooms won't have a movie).
alter table public.watch_party_rooms alter column movie_id drop not null;

-- Add an episode target.
alter table public.watch_party_rooms
  add column if not exists episode_id uuid references public.episodes(id) on delete cascade;

-- A room must target exactly one of movie or episode.
alter table public.watch_party_rooms
  drop constraint if exists watch_party_target_chk;
alter table public.watch_party_rooms
  add constraint watch_party_target_chk
  check (
    (movie_id is not null and episode_id is null)
    or (movie_id is null and episode_id is not null)
  );
