export { CenterStage, default } from "./CenterStage";
export type { CenterStageProps } from "./CenterStage";

// Co-exported so Session 3's /home composition can render the no-in-progress
// branch (Layout_Enhancements A.4) without having to reach into the package.
export { CenterStageEmptyState } from "./CenterStageEmptyState";
export type { CenterStageEmptyStateProps } from "./CenterStageEmptyState";

// Layout_Enhancements B.25 — token-perfect skeleton for hydration / first-
// paint moments. Same panel chrome + aspect ratio so the swap to the live
// stage doesn't reflow the page.
export { CenterStageSkeleton } from "./CenterStageSkeleton";
export type { CenterStageSkeletonProps } from "./CenterStageSkeleton";
