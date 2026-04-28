import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/**
 * Loading skeleton for /settings/*. SettingsLayout (the parent) renders the
 * PagePanel + tabs row around this fallback, so the skeleton only needs to
 * fill the inner content area — never the tabs themselves. Matches the
 * settings sub-pages' general rhythm: a couple of section headers with a
 * card-shaped body each.
 */
export default function SettingsLoading() {
  return (
    <div
      className="flex flex-col gap-8"
      role="status"
      aria-live="polite"
      aria-label="Loading settings"
    >
      <div className="flex items-center gap-2 text-small text-muted-foreground">
        <Spinner className="size-4 text-primary" label={null} />
        <span>Loading settings…</span>
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="mt-2 h-32 w-full rounded-xl" />
        </section>
      ))}
    </div>
  );
}
