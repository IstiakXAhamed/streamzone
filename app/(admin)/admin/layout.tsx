import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Trust the JWT: the jwt callback reads role/status from the DB at sign-in time,
  // and the JWT is signed with NEXTAUTH_SECRET so it can't be forged client-side.
  const role = (session?.user as any)?.role as string | undefined;
  const status = (session?.user as any)?.status as string | undefined;

  if (!session?.user || status !== "approved" || (role !== "admin" && role !== "superadmin")) {
    redirect("/");
  }

  const { count } = await supabaseAdmin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div data-role={role} className="flex min-h-screen bg-black text-white">
      <AdminSidebar pendingCount={count ?? 0} role={role!} />
      <div className="flex flex-1 flex-col md:ml-56">
        {/* Mobile top bar — the sidebar is hidden on small screens */}
        <header className="flex h-14 items-center justify-between border-b border-[color:var(--color-border-subtle)] px-4 md:hidden">
          <Link href="/admin" className="text-lg font-extrabold tracking-tight text-[color:var(--color-brand)]">
            Admin
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full bg-[color:var(--color-surface-2)] px-3 py-1.5 text-sm text-[color:var(--color-text-secondary)]"
          >
            <Home size={16} /> Site
          </Link>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
