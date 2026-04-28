// Skeleton matching FilmCard's real layout shape (UX_Edge_Cases CC-2 / DS §12.4).
// Not a generic spinner — the cover, title row, and meta row mirror the live
// card so layout doesn't shift when data lands.
//
// Uses Tailwind v4 utility `animate-pulse`. shadcn's `skeleton` is in the
// "Important" install bucket (DS §9.2), not "Essential" — staying off it keeps
// this file working before Leia's optional installs land.

type FilmCardSkeletonProps = {
  /** When true, hides the meta row used by /home's narrower recent-films cards. */
  compact?: boolean;
};

export function FilmCardSkeleton({ compact = false }: FilmCardSkeletonProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
      aria-hidden="true"
    >
      <div className="aspect-video w-full animate-pulse rounded-md bg-muted" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1 rounded bg-border" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
}
