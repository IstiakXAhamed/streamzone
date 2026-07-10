import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingWatchdog } from "@/components/layout/LoadingWatchdog";

export default function PartyRoomLoading() {
  return (
    <LoadingWatchdog>
      <main className="mx-auto flex min-h-screen flex-col bg-black text-white">
        <div className="flex items-center gap-3 border-b border-[color:var(--color-border-subtle)] px-4 py-3">
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[1fr_320px] lg:p-5">
          <div className="space-y-3">
            <Skeleton className="aspect-video w-full" rounded="lg" />
            <Skeleton className="h-16 w-full" rounded="lg" />
          </div>
          <Skeleton className="hidden h-[calc(100vh-220px)] w-full lg:block" rounded="lg" />
        </div>
      </main>
    </LoadingWatchdog>
  );
}
