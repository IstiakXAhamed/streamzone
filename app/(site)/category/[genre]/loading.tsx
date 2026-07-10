import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingWatchdog } from "@/components/layout/LoadingWatchdog";

export default function CategoryLoading() {
  return (
    <LoadingWatchdog>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-28 w-full" rounded="lg" />
        <Skeleton className="mb-6 h-9 w-72" rounded="full" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] w-full" rounded="md" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </LoadingWatchdog>
  );
}
