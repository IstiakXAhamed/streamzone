import { supabaseAdmin } from "@/lib/supabase/admin";
import { SaveSiteSettingsButton } from "./_components/SaveSiteSettingsButton";

export default async function AdminSettingsPage() {
  const { data: options } = await supabaseAdmin
    .from("site_settings")
    .select("*")
    .eq("key", "config")
    .maybeSingle();
  type Cfg = { siteName: string; tagline: string; accent: string; maintenanceMode: boolean; };
  const raw = options?.value as Cfg | null | undefined;
  const cfg: Cfg = raw ?? { siteName: "MovieZone", tagline: "Stream together, for free.", accent: "#e50914", maintenanceMode: false };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Site settings</h1>
      <SaveSiteSettingsButton initial={cfg} />
    </div>
  );
}
