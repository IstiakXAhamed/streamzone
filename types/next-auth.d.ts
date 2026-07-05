import type { Role, UserStatus } from "@/types/db";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    status?: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string | null;
    role?: Role;
    status?: UserStatus;
  }
}
