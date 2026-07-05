-- After `supabase migration up`, run this once to bootstrap the superadmin.
-- Replace the email + the id returned from Supabase Auth for that email.
--
--   1. Sign up the superadmin email on the Auth dashboard or via signUp()
--   2. Copy its auth.users.id
--   3. UPDATE this script with the real id, then run.
--
-- The partial unique index users_one_superadmin_idx guarantees there can
-- never be more than one superadmin.

-- Replace BOTH placeholders before running:
update public.users
set role = 'superadmin', status = 'approved', approved_at = now()
where id = '00000000-0000-0000-0000-000000000000'   -- ← auth.users.id for SUPERADMIN_EMAIL
  and email = 'you@example.com';                    -- ← SUPERADMIN_EMAIL
