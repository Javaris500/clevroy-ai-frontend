"use client";

// <ActivityFeedSkeleton /> — token-perfect placeholder for ActivityFeed while
// the Realtime channel hasn't reported any events yet. Layout_Enhancements
// B.25 — outer panel chrome (12px radius, border, card surface) matches the
// live component verbatim so swapping in real entries doesn't reflow the rail
// on /home or the right column on /create.

import { Skeleton } from "@/components/ui/skeleton";
import { activityFeed } from "@/lib/copy";

export type ActivityFeedSkeletonProps = {
  /** Number of placeholder rows to render. Defaults to 5 — enough to convey
   *  "this is a list" without over-claiming on incoming density. */
  rows?: number;
  className?: string;
};

export function ActivityFeedSkeleton({
  rows = 5,
  className,
}: ActivityFeedSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={activityFeed.ariaRegionLabel}
      aria-busy="true"
      className={[
        "relative flex h-full flex-col",
        "rounded-[12px] border border-[--color-border] bg-[--color-card]",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex-1 overflow-hidden px-3 py-2 font-mono text-[13px] leading-5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 py-[2px]"
          >
            {/* Timestamp slot */}
            <Skeleton className="h-3 w-14 shrink-0 rounded-sm" />
            {/* Status icon slot */}
            <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
            {/* Message slot — varied widths so the row reads as content */}
            <Skeleton
              className={[
                "h-3 rounded-sm",
                idx % 3 === 0
                  ? "w-3/5"
                  : idx % 3 === 1
                    ? "w-4/5"
                    : "w-2/3",
              ].join(" ")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeedSkeleton;
