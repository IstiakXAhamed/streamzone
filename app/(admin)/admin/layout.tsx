import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
      <main className="ml-0 flex-1 p-6 md:ml-56 lg:p-8">{children}</main>
    </div>
  );
}
