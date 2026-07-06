import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Verify role against the database on every admin page load (don't trust JWT alone)
  let role: "user" | "admin" | "superadmin" = "user";
  let pendingCount = 0;

  if (session?.user?.email) {
    const { data: row } = await supabaseAdmin
      .from("users")
      .select("role,status")
      .ilike("email", session.user.email)
      .maybeSingle();

    if (row && row.status === "approved" && (row.role === "admin" || row.role === "superadmin")) {
      role = row.role as "admin" | "superadmin";
    } else {
      redirect("/");
    }

    const { count } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;
  } else {
    redirect("/");
  }

  return (
    <div data-role={role} className="flex min-h-screen bg-black text-white">
      <AdminSidebar pendingCount={pendingCount} role={role} />
      <main className="ml-0 flex-1 p-6 md:ml-56 lg:p-8">{children}</main>
    </div>
  );
}
