import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { SessionUser } from "@/lib/auth";
import type { Role } from "@/types/db";

/**
 * Auth guard for Route Handlers. Trusts the NextAuth JWT for role/status
 * (signed with NEXTAUTH_SECRET, can't be forged client-side) and only verifies
 * the user has a valid session — no DB lookup. This avoids RLS/permission issues
 * while keeping admin-only APIs protected from non-admins.
 */
export async function requireUser(): Promise<
  { user: SessionUser; error: null } | { user: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const jwtRole = (session.user as any)?.role as Role | undefined;
  const jwtStatus = (session.user as any)?.status as string | undefined;

  if (jwtStatus === "pending") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Your account is pending approval by an admin." },
        { status: 403 },
      ),
    };
  }
  if (jwtStatus === "suspended") {
    return {
      user: null,
      error: NextResponse.json({ error: "Your account has been suspended." }, { status: 403 }),
    };
  }

  const user: SessionUser = {
    id: (session.user as any)?.id ?? "",
    email: session.user.email ?? "",
    name: session.user.name,
    image: session.user.image,
    role: jwtRole ?? "user",
    status: (jwtStatus as SessionUser["status"]) ?? "approved",
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
