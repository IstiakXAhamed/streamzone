import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { FriendsContent } from "./_components/FriendsContent";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return <FriendsContent />;
}
