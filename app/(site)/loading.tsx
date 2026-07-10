import { Skeleton } from "@/components/ui/Skeleton";
import { MovieCardSkeleton } from "@/components/home/MovieCard";
import { LoadingWatchdog } from "@/components/layout/LoadingWatchdog";

function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div>
      <Skeleton className="mb-3 h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <LoadingWatchdog>
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <section className="space-y-8">
          <Skeleton className="aspect-[16/7] w-full sm:aspect-[16/6]" rounded="lg" />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </section>
      </main>
    </LoadingWatchdog>
  );
}
