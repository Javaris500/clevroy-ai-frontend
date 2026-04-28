"use client";

// <CenterStageSkeleton /> — token-perfect placeholder for the CenterStage
// panel (Layout_Enhancements B.25). Used while the in-progress film is
// hydrating from the server (Home A.4 path) and during the brief moment
// after Start before the first realtime event lands on /create.
//
// Layout shape mirrors the rounded 12px panel-elev card with a 16:9 aspect
// ratio. Inner placeholder rows hint at the phase narration block sitting
// just below — stays visually consistent so the swap to the real CenterStage
// doesn't reflow the page.

import { Skeleton } from "@/components/ui/skeleton";
import { centerStage } from "@/lib/copy";
import { cn } from "@/lib/utils";

export type CenterStageSkeletonProps = {
  /** Aspect ratio string. Defaults to 16:9 to match the live stage's
   * pre-parse default (Design_System §8.1). */
  aspectRatio?: string;
  className?: string;
};

const RATIO_TO_PADDING: Record<string, string> = {
  "16:9": "56.25%",
  "9:16": "177.78%",
  "1:1": "100%",
  "4:5": "125%",
};

export function CenterStageSkeleton({
  aspectRatio = "16:9",
  className,
}: CenterStageSkeletonProps) {
  const paddingTop = RATIO_TO_PADDING[aspectRatio] ?? RATIO_TO_PADDING["16:9"];

  return (
    <section
      role="region"
      aria-label={centerStage.ariaRegionLabel}
      aria-busy="true"
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
      style={{ paddingTop }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
        {/* Centered placeholder cluster — small enough to read as "loading"
            without dominating the panel. */}
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex w-full max-w-md flex-col items-center gap-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </section>
  );
}

export default CenterStageSkeleton;
