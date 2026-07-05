import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/requireRole";
import { userAdminActionSchema } from "@/lib/validators";

/**
 * POST /api/admin/users
 * Body: { action: 'approve' | 'suspend' | 'promote_admin' | 'demote_user', targetUserId }
 * Only admins & superadmins may act; only the superadmin may promote/demote.
 * Every action is written to `admin_activity_log`.
 */
export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const parsed = userAdminActionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { action, targetUserId } = parsed.data;

  const roleChanging = action === "promote_admin" || action === "demote_user";
  if (roleChanging && user.role !== "superadmin") {
    return NextResponse.json({ error: "Only the superadmin may change roles." }, { status: 403 });
  }
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "You cannot act on your own account." }, { status: 400 });
  }

  const isApprove = action === "approve";
  const isSuspend = action === "suspend";
  const newStatus = isApprove ? "approved" : isSuspend ? "suspended" : undefined;
  const newRole = action === "promote_admin" ? "admin" : action === "demote_user" ? "user" : undefined;

  const patch: Record<string, unknown> = {};
  if (newStatus) {
    patch.status = newStatus;
    patch.approved_by = user.id;
    patch.approved_at = new Date().toISOString();
  }
  if (newRole) patch.role = newRole;

  const { error: updErr } = await supabaseAdmin.from("users").update(patch).eq("id", targetUserId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  await supabaseAdmin.from("admin_activity_log").insert({
    admin_user_id: user.id,
    action,
    target_id: targetUserId,
    metadata: { newStatus, newRole },
  });

  return NextResponse.json({ ok: true, newStatus, newRole });
}
