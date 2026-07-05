import type { Role, UserStatus } from "@/types/db";

/** Session payload that NextAuth will expose to both client and server. */
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: Role;
  status: UserStatus;
}

export const roleGrantsUpload: Role[] = ["admin", "superadmin"];

/** True if the user's registration has been approved and they're not suspended. */
export function isApproved(status: UserStatus | undefined | null): boolean {
  return status === "approved";
}
