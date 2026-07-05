import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. **Only import inside trusted server code** —
 * it bypasses RLS. Used for:
 *  - ingesting movie rows from Drive metadata
 *  - approving / promoting users from the admin panel
 *  - writing audit-log entries
 *  - seeding the superadmin row on first boot
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
