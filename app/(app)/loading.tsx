import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/**
 * Suspense fallback for every (app) route transition.
 *
 * Without a loading.tsx in this segment, Next's App Router holds the prior
 * page in view until the new route's bundle is ready — so clicks feel dead
 * and the page jumps in once everything resolves. Mounting this skeleton
 * gives every navigation an immediate paint, which is the single biggest
 * lever on perceived routing speed in this repo (every (app) page is a
 * client component, so RSC streaming can't cover it).
 *
 * The skeleton mirrors the inset's general content shape (toolbar row +
 * a card grid) without trying to be route-specific — per-route loading
 * skeletons can be added later as `app/(app)/{route}/loading.tsx` files
 * if a particular surface benefits from a closer match.
 */
export default function AppLoading() {
  return (
    <div
      className="flex flex-col gap-6 p-6 md:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex items-center gap-2 text-small text-muted-foreground">
        <Spinner className="size-4 text-primary" label={null} />
        <span>Loading…</span>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-11 flex-1 sm:max-w-md" />
          <Skeleton className="h-11 w-48" />
          <Skeleton className="ml-auto h-11 w-32 sm:ml-0" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full" />
        ))}
      </div>
    </div>
  );
}
