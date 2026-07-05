import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { TopNav } from "./_components/TopNav";
import { BottomTabs } from "./_components/BottomTabs";

/**
 * Wraps all public routes. Server-side gate: pending/unapproved users without an
 * approved row are redirected to `/pending`. Admins also reach the dashboard
 * via the `(admin)` group below; this shell is the default public chrome.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Not signed in → leave the auth / guest routes alone (home stays public).
  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <div className="flex-1">{children}</div>
        <BottomTabs />
      </div>
    );
  }

  if (session.user.status === "pending") {
    redirect("/pending");
  }
  if (session.user.status === "suspended") {
    redirect("/api/auth/signout");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex-1">{children}</div>
      <BottomTabs />
    </div>
  );
}
