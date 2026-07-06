import { supabaseAdmin } from "@/lib/supabase/admin";
import { SeriesAdminClient } from "./_components/SeriesAdminClient";
import type { SeriesRow } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage() {
  const { data } = await supabaseAdmin
    .from("series")
    .select("id,title,slug,seasons_count,episodes_count,status,featured,is_public,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return <SeriesAdminClient initial={(data ?? []) as unknown as SeriesRow[]} />;
}
