-- Site-level config key/value (singleton 'config' row for now).
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values ('config', '{"siteName":"MovieZone","tagline":"Stream together, for free.","accent":"#e50914","maintenanceMode":false}'::jsonb)
on conflict (key) do nothing;
