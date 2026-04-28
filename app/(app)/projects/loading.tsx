import { FilmCardSkeleton } from "@/components/film-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/**
 * Loading skeleton for /projects. Shadows ProjectsView's exact layout:
 *   - h1 page heading
 *   - search input + sort select + "New film" CTA toolbar (h-11)
 *   - status filter chips row
 *   - 8-cell film card grid (matches the page's first paint)
 *
 * The closer this matches the loaded page, the less the route transition
 * "jumps" when the real data lands.
 */
export default function ProjectsLoading() {
  return (
    <div
      className="flex flex-col gap-6 p-6 md:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading projects"
    >
      <div className="flex items-center gap-2 text-small text-muted-foreground">
        <Spinner className="size-4 text-primary" label={null} />
        <span>Loading projects…</span>
      </div>

      <header className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
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
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <FilmCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
