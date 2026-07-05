import { supabaseAdmin } from "@/lib/supabase/admin";
import { CreatePartyContent } from "./_components/CreatePartyContent";

export const dynamic = "force-dynamic";

export default async function CreatePartyPage() {
  const { data } = await supabaseAdmin
    .from("movies")
    .select("id,title,slug,poster_url")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return <CreatePartyContent movies={data ?? []} />;
}
