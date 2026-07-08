-- Upload sessions: stores Google Drive resumable upload URLs + tokens keyed by
-- a short UUID so chunk requests only need to pass the tiny session id (avoids
-- Vercel WAF blocking long URLs/tokens in headers, and works across serverless
-- instances). Rows are short-lived and cleaned up after completion or expiry.

create table if not exists public.upload_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  upload_url text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for cleanup of stale sessions
create index if not exists upload_sessions_created_at_idx on public.upload_sessions (created_at);

-- Only the service role (used by our server-side API routes) may touch this
-- table. It contains OAuth tokens, so it must never be exposed to anon/auth roles.
grant all privileges on table public.upload_sessions to service_role;
alter table public.upload_sessions enable row level security;
