import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/**
 * Loading skeleton for /ai-twin. Matches the page's PagePanel shape:
 * H1 + subline header, then two cards side-by-side on desktop / stacked
 * on mobile (Voice twin + Face twin per Design_System §7.6).
 */
export default function AiTwinLoading() {
  return (
    <section
      className="@container/page rounded-lg bg-card p-6 @md:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading AI Twin"
    >
      <div className="mb-6 flex items-center gap-2 text-small text-muted-foreground">
        <Spinner className="size-4 text-primary" label={null} />
        <span>Loading your twin…</span>
      </div>

      <header className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80" />
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 @md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-4 h-40 w-full rounded-lg" />
            <div className="mt-2 flex justify-end gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
