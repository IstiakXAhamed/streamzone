-- Series support: add missing columns + episode history
alter table public.series add column if not exists rating float;
alter table public.series add column if not exists featured boolean not null default false;
alter table public.series add column if not exists views_count bigint not null default 0;

-- watch_history gains episode_id for series support
alter table public.watch_history add column if not exists episode_id uuid references public.episodes(id) on delete cascade;
drop index if exists watch_history_user_watched_idx;
create index if not exists watch_history_user_watched_idx on public.watch_history (user_id, watched_at desc);
