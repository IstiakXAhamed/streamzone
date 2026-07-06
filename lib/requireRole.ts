import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authOptions } from "@/lib/authOptions";
import type { SessionUser } from "@/lib/auth";
import type { Role } from "@/types/db";

/**
 * Auth guard for Route Handlers. Uses the NextAuth session + service-role DB
 * lookup (bypasses RLS). Returns the user, or a NextResponse error the caller
 * can `return` directly from the handler.
 */
export async function requireUser(): Promise<
  { user: SessionUser; error: null } | { user: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: row } = await supabaseAdmin
    .from("users")
    .select("id,email,name,avatar_url,role,status")
    .ilike("email", session.user.email)
    .maybeSingle();

  if (!row) {
    return {
      user: null,
      error: NextResponse.json({ error: "User record not found" }, { status: 403 }),
    };
  }
  if (row.status === "pending") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Your account is pending approval by an admin." },
        { status: 403 },
      ),
    };
  }
  if (row.status === "suspended") {
    return {
      user: null,
      error: NextResponse.json({ error: "Your account has been suspended." }, { status: 403 }),
    };
  }

  const user: SessionUser = {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.avatar_url,
    role: row.role as Role,
    status: row.status as SessionUser["status"],
  };
  return { user, error: null };
}

/** Wraps requireUser with an additional role check. */
export async function requireRole(...roles: Role[]) {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };
  if (!roles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Insufficient role" }, { status: 403 }),
    };
  }
  return { user, error: null };
}
