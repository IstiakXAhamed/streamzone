-- MovieZone initial schema. Apply via `supabase db push` or SQL editor.
-- Requires the `uuid-ossp` extension (enabled by default on Supabase).

create extension if not exists "uuid-ossp";

-- users
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin','superadmin')),
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- Exactly one superadmin ever
create unique index if not exists users_one_superadmin_idx on public.users (role)
  where role = 'superadmin';

-- movies
create table if not exists public.movies (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  description text,
  year int,
  duration_seconds int,
  genre text[] not null default '{}',
  poster_url text,
  backdrop_url text,
  drive_file_id text not null,
  drive_direct_link text,
  trailer_drive_file_id text,
  rating float,
  featured boolean not null default false,
  views_count bigint not null default 0,
  is_public boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists movies_featured_created_idx
  on public.movies (featured desc, created_at desc);
create index if not exists movies_views_idx on public.movies (views_count desc);
create index if not exists movies_genre_idx on public.movies using gin (genre);

-- categories
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0
);

-- watch history
create table if not exists public.watch_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  position_seconds int not null default 0,
  watched_at timestamptz not null default now()
);

create index if not exists watch_history_user_watched_idx
  on public.watch_history (user_id, watched_at desc);

-- watch party rooms
create table if not exists public.watch_party_rooms (
  id uuid primary key default uuid_generate_v4(),
  host_user_id uuid not null references public.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists watch_party_rooms_created_idx
  on public.watch_party_rooms (created_at desc);

-- saved offline
create table if not exists public.saved_offline (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  saved_at timestamptz not null default now()
);

create unique index if not exists saved_offline_user_movie_idx
  on public.saved_offline (user_id, movie_id);

-- chat messages
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.watch_party_rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room_id, created_at asc);

-- admin activity log
create table if not exists public.admin_activity_log (
  id uuid primary key default uuid_generate_v4(),
  admin_user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_created_idx
  on public.admin_activity_log (created_at desc);
