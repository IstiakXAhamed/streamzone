# MovieZone — contributor guide

MovieZone is a Netflix-style movie streaming web app built **entirely on free tiers**. The single hard constraint that drives every architecture decision: **video bytes must stream directly from Google Drive to the viewer's browser — our server must never proxy them**, or we blow the free bandwidth budget.

## Three choices locked in planning
1. **Open registration, admin-moderated.** Every self-registered user starts as `status = 'pending'` and sees an "Awaiting admin approval" placeholder until a superadmin approves them.
2. **Google Drive via GCP service account + "anyone with the link — Viewer" sharing.** `/api/stream/[movieId]` returns a signed direct Drive URL; our host carries no video bytes.
3. **Vercel free only — no Railway/Render.** Watch-party synchronization and chat are done over **Supabase Realtime** broadcast + presence channels, since Next.js API routes on Vercel can't hold raw websockets.

## Stack
Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript · Supabase (Postgres + Auth + Realtime) · NextAuth · Google Drive API · framer-motion · shadcn/ui · Plyr player · simple-peer (WebRTC voice) · TanStack Query + Zustand · zod.

## First-run setup
1. Copy `.env.local.example` to `.env.local` and fill in real values (supabase URL/anon/super-keys, superadmin email, Drive service account base64, Drive API key, Drive movie-folder id).
2. Apply the migration in `supabase/migrations/0001_init.sql`.
3. Run the superadmin seed in `supabase/supabase-seed-superadmin.sql` after creating your superadmin auth user.
4. Drop 192 & 512 PNG icons in `public/icons/`.
5. `npm run dev` — home page renders setup checklist until movies are ingested.

## Repository layout (top-level)
```
app/
  (site)/                        public routes + (admin)/ admin routes
  api/                           route handlers (auth, stream, movies, users, party, offline, admin, smoke)
components/                      ui · layout · hero · carousel · player · party · home · admin
lib/                             auth · requireRole · supabase/* · googleDrive · partyChannel · webrtc · validators
hooks/                           useParty · useStreamUrl · usePartyChat · useVoice · …
public/                          manifest.webmanifest · sw.js · offline.html · icons/
supabase/migrations/             schema seed scripts
types/db.ts                      database row shapes
```

## Next.js 16 gotcha
`params` on pages, layouts, and route handlers is **a Promise** (see `app/api/…/dynamic-routes.md` in `node_modules/next`). Always `await params`:
```ts
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  ...
}
```

## Verification
- `npm run lint && npm run build` must stay green.
- Smoke endpoint: `/api/smoke` returns Supabase + Drive env status.

## Phases (pick up the next one from the task list)
0 · bootstrap (done)
1 · auth + registration moderation + public shell + home
2 · movie ingestion + admin movies grid
3 · player, detail page, streaming loop
4 · saved offline + download manager
5 · watch party sync through Supabase Realtime
6 · voice chat (simple-peer mesh)
7 · admin analytics / rooms / settings / audit
8 · mobile UX hardening + performance
