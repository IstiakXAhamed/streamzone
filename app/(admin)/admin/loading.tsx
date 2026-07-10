import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingWatchdog } from "@/components/layout/LoadingWatchdog";

export default function AdminHomeLoading() {
  return (
    <LoadingWatchdog>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    </LoadingWatchdog>
  );
}
