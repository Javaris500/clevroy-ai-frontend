"use client";

// <SceneStripSkeleton /> — token-perfect placeholder for SceneStrip while
// scenes are still hydrating. Layout_Enhancements B.25 — the skeleton mirrors
// the live component's geometry (44×44 on mobile / 56×56 at >=sm, 12px radius
// in vertical mode to match the A.14 stacked-card treatment) so the swap to
// the real strip doesn't reflow the parent panel.

import { Skeleton } from "@/components/ui/skeleton";

export type SceneStripSkeletonProps = {
  /** How many placeholder pills to render. Defaults to 6, the typical scene
   *  count for a beta short. */
  count?: number;
  /** Match the live SceneStrip's `direction` prop so the skeleton chrome
   *  doesn't reflow when real data lands. */
  direction?: "horizontal" | "vertical";
  className?: string;
};

export function SceneStripSkeleton({
  count = 6,
  direction = "horizontal",
  className,
}: SceneStripSkeletonProps) {
  const isVertical = direction === "vertical";
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-direction={direction}
      className={[
        isVertical
          ? "flex flex-col items-stretch gap-2"
          : "flex items-center gap-2 overflow-x-hidden",
        "px-1 py-1",
        className ?? "",
      ].join(" ")}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={[
            "h-11 w-11 shrink-0 sm:h-14 sm:w-14",
            isVertical ? "rounded-lg" : "rounded-[10px]",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

export default SceneStripSkeleton;
