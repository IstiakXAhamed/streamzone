# MovieZone — Complete Hosting & Connection Guide

Follow these steps **in order**. Items you already have can be skipped.

You will create:
1. A **Supabase** project (free) — DB + Auth + Realtime + secrets.
2. A **Google Cloud project** — Drive API key + service account (so the app can build stream URLs from Drive file IDs).
3. **Google OAuth client** — so NextAuth's "Continue with Google" works.
4. A **Vercel** project (free) — hosts the frontend + API routes + Supabase Realtime channels (no Railway).
5. A **Google Drive folder** for your movies, shared correctly.

Your superadmin: **SANIM1728@GMAIL.COM** (already wired in `.env.local`).

---

## STEP 1 — Supabase project (free tier)

1. Go to <https://supabase.com> → **Start your project** → create a new org or use the default.
2. Click **New Project**
   - **Name:** `moviezone` (or anything).
   - **Database Password:** save this somewhere (you'll need it to connect locally via `supabase` CLI if you use it). The app only uses the anon + service keys, so losing this is not fatal — but save it anyway.
   - **Region:** pick the region closest to you (affects Supabase Realtime latency).
3. Wait for the project to provision (~2 minutes).
4. In the sidebar → **Project Settings → API**:
   - `Project URL` → paste into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → past as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → past as `SUPABASE_SERVICE_ROLE_KEY`
5. ⚠️ Paste these into your `.env.local` **right now** so you don't forget.

### Apply the schema

1. Inside your dashboard → **SQL Editor** (left sidebar).
2. Click **New Query** → paste the contents of `supabase/migrations/0001_init.sql` (in your repo) → **Run**.
3. Click **New Query** → paste `supabase/migrations/0002_site_settings.sql` → **Run**.
4. Tables created: `users`, `movies`, `categories`, `watch_history`, `watch_party_rooms`, `saved_offline`, `chat_messages`, `admin_activity_log`, `site_settings`.
5. Check: go to **Table Editor** → you should see all tables listed.

### Create the superadmin auth user

1. Dashboard → **Authentication → Users → Add user → Create new user**.
2. **Email:** `SANIM1728@GMAIL.COM` — **Password:** pick something strong (your `Sanim9944` is what you typed in chat; I recommend you change it if that's reused anywhere).
3. ✅ **Auto-confirm user** (so you don't need a confirmation email).
4. **Copy the UUID** that appears in the new user row.
5. Go to **SQL Editor** → **New query**:
   ```sql
   insert into public.users (id, email, name, role, status, approved_by, approved_at)
   values ('<PASTE-THE-UUID>', 'SANIM1728@GMAIL.COM', 'Sanim', 'superadmin', 'approved', '<PASTE-THE-UUID>', now())
   on conflict (email) do update set role = 'superadmin', status = 'approved', approved_by = '<PASTE-THE-UUID>', approved_at = now();
   ```
   Replace BOTH placeholders with the UUID. → **Run.**

### Enable Row Level Security (RLS)

The migration created the tables; you must turn on RLS and write policies, or the browser client won't be able to read public data:

1. **SQL Editor → New query**, run this:
   ```sql
   -- USERS: each user can read + update their own row; superadmins can update any.
   alter table public.users enable row level security;
   create policy "users_read_self" on public.users for select using (true);   -- public directory
   create policy "users_update_self" on public.users for update using (auth.uid() = id);

   -- MOVIES: anyone can read public movies; superadmin/admin can do anything.
   alter table public.movies enable row level security;
   create policy "movies_read_public" on public.movies for select using (is_public = true);
   create policy "movies_admin_write" on public.movies for all using (
     auth.uid() in (select id from public.users where role in ('admin','superadmin'))
   );

   -- CATEGORIES: read-only public.
   alter table public.categories enable row level security;
   create policy "categories_read_public" on public.categories for select using (true);

   -- WATCH HISTORY: owner can read/write.
   alter table public.watch_history enable row level security;
   create policy "history_owner" on public.watch_history for all using (auth.uid() = user_id);

   -- WATCH PARTY ROOMS: open read for public rooms; host can write.
   alter table public.watch_party_rooms enable row level security;
   create policy "rooms_read" on public.watch_party_rooms for select using (true);
   create policy "rooms_host_write" on public.watch_party_rooms for all using (auth.uid() = host_user_id);

   -- SAVED OFFLINE: owner only.
   alter table public.saved_offline enable row level security;
   create policy "saved_owner" on public.saved_offline for all using (auth.uid() = user_id);

   -- CHAT MESSAGES: open read/write inside a room.
   alter table public.chat_messages enable row level security;
   create policy "chat_read" on public.chat_messages for select using (true);
   create policy "chat_write" on public.chat_messages for insert with check (true);

   -- ADMIN ACTIVITY + SITE SETTINGS: admin-only.
   alter table public.admin_activity_log enable row level security;
   create policy "admin_log_admin" on public.admin_activity_log for all using (
     auth.uid() in (select id from public.users where role in ('admin','superadmin'))
   );
   alter table public.site_settings enable row level security;
   create policy "settings_admin" on public.site_settings for all using (
     auth.uid() in (select id from public.users where role in ('admin','superadmin'))
   );
   create policy "settings_read" on public.site_settings for select using (true);
   ```

### Enable Realtime (parties use this)

1. Dashboard → **Database → Replication**.
2. In the **Supabase Realtime** section, toggle **Enabled** for the tables used by the broadcast channel (minimally `watch_party_rooms`).
   - Enabling realtime on too many tables, especially ones with heavy writes like `watch_history`, can hit limits quickly. Keep it to `watch_party_rooms` + `users` + `site_settings`.

---

## STEP 2 — Google Cloud project (free tier, Drive API + service account)

> All Google Cloud APIs you'll enable are in the **free tier**, well within the 5 TB Drive storage quota you already have.

### A. Create the Google Cloud project

1. Go to <https://console.cloud.google.com> → top-left project selector → **New Project**.
2. **Name:** `moviezone` → **Create**.

### B. Enable the Google Drive API

1. Sidebar → **APIs & Services → Library**.
2. Search **"Google Drive API"** → **Enable**.

### C. Create a service account (builds Drive stream URLs for `/api/stream`)

1. Sidebar → **APIs & Services → Credentials** → **Create Credentials → Service account**.
2. **Name:** `moviezone-drive` → **Create and continue**.
3. Skip the role + user grants (just click **Done**).
4. Click the service account row → **Keys tab → Add Key → Create new key → JSON** → a JSON file downloads. Keep it safe.
5. Open the file in a text editor. Copy the full contents (including `{` ... `}`).
6. **Base64-encode** it, e.g. on macOS:
   ```bash
   cat ~/Downloads/<service-account>.json | base64 | tr -d '\n'
   ```
7. Paste the base64 string into `.env.local` as `GOOGLE_SERVICE_ACCOUNT_JSON_B64`.

### D. Create a public Drive API key

> Needed for the browser-side player to issue *direct* Range requests to Drive. Optional if you always use the service-account-signed stream URL; keeping it gives extra resilience.

1. Dashboard → **APIs & Services → Credentials** → **Create Credentials → API Key**.
2. Copy the key.
3. Click the key → under **Application restrictions** select **HTTP referrers**.
4. Add your prod domain (and `http://localhost:3000/*` for dev):
   ```
   http://localhost:3000/*
   https://*.vercel.app/*
   https://yourdomain.com/*
   ```
5. Under **API restrictions** → **Restrict key** → choose **Drive API** → **Save**.
6. Paste into `.env.local` as `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY`.

### E. Share your Drive movies folder

1. Go to **Google Drive** → find the folder where you put your movies.
2. Right-click → **Share → General access → Anyone with the link → Viewer**.
3. Open the folder and copy the URL. The folder ID is the long random string after `folders/` — paste into `.env.local`:
   ```
   NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID=<paste-id>
   ```
4. Supabase service account also reads the folder, so add the service account email as a viewer too:
   - The service account email is inside your JSON key (format `<name>@<project>.iam.gserviceaccount.com`).
   - Right-click folder → Share → add that email → Viewer → **Done**.

---

## STEP 3 — Google OAuth (so "Continue with Google" works in NextAuth)

> Required if you want Google sign-in. If you prefer email-only, this step is optional.

1. Cloud Console → **APIs & Services → OAuth consent screen**.
2. **User Type:** **External** → create.
3. **App name:** `MovieZone`, your email under support + developer contact, **Save and continue** through the scopes page (no scopes to add for plain sign-in).
4. On **Test users**, add `SANIM1728@GMAIL.COM`. (Skip this step if your app will be Public / in Production — but as a friend-zone app, leaving it in Test mode is fine as long as all your invited users are also added here.)
5. **Credentials → Create Credentials → OAuth client ID**.
6. **Application type:** Web application.
7. Name: `MovieZone Web`.
8. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `https://*.vercel.app`
   - `https://yourdomain.com`
9. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-vercel-app.vercel.app/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
10. Create → copy the `Client ID` and `Client Secret` into `.env.local`:
    ```
    GOOGLE_CLIENT_ID=<...>.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=<...>
    ```

---

## STEP 4 — Generate the remaining secrets

### `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

Paste into `.env.local`.

### `NEXTAUTH_URL`

While developing: `http://localhost:3000`.

After deploying to a custom domain: your real domain (no trailing slash).

---

## STEP 5 — Verify .env.local is complete

It should have all of these filled:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SUPERADMIN_EMAIL=SANIM1728@GMAIL.COM
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=
NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_JSON_B64=
```

**Confirm `.env.local` is not tracked by git:**

```bash
cd "/Users/sanim/My Projects/MovieZone/moviezone"
git status --short | grep env.local   # should produce NO output
```

If it **does** appear, re-add it to `.gitignore`:

```
echo ".env.local" >> .gitignore
```

---

## STEP 6 — Run locally end-to-end

```bash
cd "/Users/sanim/My Projects/MovieZone/moviezone"
npm run dev
```

Open <http://localhost:3000>. You should see the home page with the **setup checklist** (no movies → empty state).

**Smoke test:**

```
http://localhost:3000/api/smoke
```

Should return JSON starting with `{"ok":true,...}` once keys are valid.

**Sign in:**

1. Click **Sign in → Continue with Google** (or email route if you built credentials).
2. Sign out, sign back in as `SANIM1728@GMAIL.COM` (you auto-map to superadmin on first sign-up).

**Verify:**

- Home now shows your setup-checklist page (still empty of movies) but your avatar is in the top bar.
- Visit `/admin` → dashboard with four KPI tiles.
- Visit `/admin/movies` → **Add movie** button.
- Open Drive, get an MP4's file ID: navigate to the file in Drive and check the URL (`https://drive.google.com/file/d/<FILE_ID>/view`). Copy the ID.
- Back in `/admin/movies` → **Add movie** → fill:
  - **Title:** e.g. `Inception`
  - **Drive file ID (MP4) *:** `<paste-ID>`
  - **Poster file ID** (optional) — Drive image file ID.
  - **Backdrop file ID** (optional).
  - Save.

**Test the player:**

- Home should now render a carousel row with your movie card.
- Click it → detail page → "▶ Watch" → `/api/stream` returns your Drive URL and the Plyr starts the MP4 (bytes come directly from Google).

**Test the party:**

- Click "👥 Watch Party" → pick a movie → create → copy the invite link → open in a second browser/phone → both rooms show.
- Messages in the chat panel flow across in real time.

---

## STEP 7 — Deploy to Vercel (free tier)

### 1. Push to GitHub (optional but recommended)

```bash
cd "/Users/sanim/My Projects/MovieZone/moviezone"
git remote add origin <your-github-url>
git push -u origin main
```

> If you ship without pushing, you can use `vercel deploy --prod` from the CLI with a local bridge.

### 2. Create Vercel project

1. <https://vercel.com> → Add New → Project → import the GitHub repo.
2. **Framework:** Next.js (auto-detected). Keep default settings.

### 3. Configure environment

1. **Settings → Environment Variables**.
2. Copy EVERY variable from your local `.env.local` to Vercel:
   - Set **Environment** to "All Environments" (or pick Preview + Production as you like).
3. ⚠️ **`NEXTAUTH_URL`** must be updated to your Vercel URL in Vercel's env (you can keep the local one locally). If using a custom domain, set it to that.

### 4. Build Settings

Keep defaults (Next.js + Turbopack). Build command is `next build`; output is `.next`.
**Install Command:** `npm install` (or `npm ci` if you want deterministic builds from the lockfile).

### 5. Deploy

Click **Deploy**. On first push or manual Deploy, Vercel builds and provisions your free HTTPS domain (`moviezone-xxxx.vercel.app`).

**Post-deploy:**

1. Once the URL works, go back to:
   - **Vercel → Settings → Environment Variables** → set `NEXTAUTH_URL=https://moviezone-xxxx.vercel.app`.
   - **Google Cloud → OAuth Credentials** → add the new production origin / redirect URI to the allow-list.
   - **Google Cloud → API Key HTTP referrers** → add `https://moviezone-xxxx.vercel.app/*`.
2. **Redeploy** (small env change) so the new env vars take effect.

---

## STEP 8 — Wire the you-can't-do-this-yet pieces

### Custom domain (recommended, but optional)

1. Vercel → **Settings → Domains** → add your domain.
2. Point your DNS:
   - **Apex domain** (`yourdomain.com`) → Vercel's IP (shown in dashboard).
   - **www subdomain** → `cname.vercel-dns.com`.
3. Update `NEXTAUTH_URL=https://yourdomain.com` on Vercel + **redeploy**.
4. Update Google OAuth origins/redirects + API-key referrers to your new domain + redeploy.

### Verify after every deploy

| Check | Where | What to look for |
|---|---|---|
| Page load | Load `/` | No 500s, hero + carousels render |
| Smoke | `/api/smoke` | `{"ok":true}` |
| Sign in | `/login` → Google | No OAuth callback URL mismatch error |
| First movie plays | `/watch/<id>` | Plyr shows the MP4 from Drive |
| Party | `/party/create` → both chat | Messages sync across two tabs |

---

## TROUBLESHOOTING

| Symptom | Likely cause | Fix |
|---|---|---|
| `500 · supabaseUrl is required` on start | `.env.local` missing/unfilled keys. | Fill all 11 variables in STEP 5. |
| Google sign-in errors with "redirect_uri_mismatch" | Vercel (or local) origin not allow-listed. | Add origin + `/api/auth/callback/google` to OAuth credentials. |
| Player stuck on "Preparing stream…" | Drive file ID wrong OR the file is locked behind Drive's daily download quota. | Check `/api/smoke` → stream URL works? If the file shows *"file can't be scanned for viruses"*, the 24-hour per-file cap has been hit; wait or mirror the file to a different Drive account. |
| Party chat doesn't persist across reloads | Realtime not enabled in Supabase (Database → Replication → `watch_party_rooms`). | Toggle realtime on. |
| Sign-in says "Account pending" immediately after sign-up | Your superadmin email isn't seeded. | Re-run STEP 1 "Create the superadmin auth user" → seed SQL → verify `/admin/users` shows your row as `approved` + `superadmin`. |
| Watch party page isn't found | Build cache. | `npm run build` locally first — any `params must be await`-type error shows up here (Next.js 16 convention). |

### Handy secrets-diagnostics route

`http://localhost:3000/__smoke` — removed by default. To recreate, drop this file then rebuild:

```ts
// app/api/smoke/route.ts  (already in repo)
// hit GET /api/smoke
```

---

## NEXT steps (after everything is up)

1. **Bring up the full mobile UX** — drop `icon-192.png` + `icon-512.png` in `public/icons/`.
2. **Warm your AI-powered catalogue** — ingest a handful of titles first so carousels have content; the UI scales with any amount of content.
3. **Invite friends** — they self-register, get `pending`, you promote them from `/admin/users`.
4. **Test on your phone** — `http://<your-local-ip>:3000` on the same LAN works; PWA install the site to get full-screen + offline playback.
