import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingWatchdog } from "@/components/layout/LoadingWatchdog";

export default function MovieDetailLoading() {
  return (
    <LoadingWatchdog>
      <article>
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        <Skeleton className="absolute inset-0 h-full w-full" rounded="sm" />
      </div>

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-6 sm:grid-cols-[220px_1fr] sm:px-6 lg:px-8">
        <div className="mx-auto w-40 sm:mx-0 sm:w-full">
          <Skeleton className="aspect-[2/3] w-full" rounded="lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" rounded="full" />
            <Skeleton className="h-6 w-16" rounded="full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" rounded="full" />
            <Skeleton className="h-10 w-24" rounded="full" />
            <Skeleton className="h-10 w-32" rounded="full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-3 h-6 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex w-36 shrink-0 flex-col gap-2 sm:w-44">
              <Skeleton className="aspect-[2/3] w-full" rounded="md" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          ))}
        </div>
      </section>
      </article>
    </LoadingWatchdog>
  );
}
