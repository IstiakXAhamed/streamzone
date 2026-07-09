-- Friends system: users can send/accept friend requests.
-- Watch parties can be restricted to friends only.

create table if not exists public.friendships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  friend_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique(user_id, friend_id)
);

-- Index for quick lookups
create index if not exists friendships_user_idx on public.friendships (user_id, status);
create index if not exists friendships_friend_idx on public.friendships (friend_id, status);

-- Grant service role access
grant all privileges on table public.friendships to service_role;
alter table public.friendships enable row level security;

-- Add friends_only column to watch_party_rooms
alter table public.watch_party_rooms
  add column if not exists friends_only boolean not null default false;
