import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Used in Client Components and anywhere
 * code needs to run in the browser. The anon key + RLS enforce the
 * user's permissions on every query.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
