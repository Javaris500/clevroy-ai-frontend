"use client";

// State `pending` — pre-roll just before parsing kicks off. Brief by design;
// the simulator dwells here for ~1.2s. Reuses the parsing canvas so there's
// no flash when the state advances.

import { Loader2 } from "lucide-react";

export type PendingStageProps = {
  prefersReducedMotion: boolean;
};

export function PendingStage({ prefersReducedMotion }: PendingStageProps) {
  return (
    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
      <Loader2
        aria-hidden="true"
        className={["h-6 w-6", prefersReducedMotion ? "" : "animate-spin"].join(" ")}
        strokeWidth={1.5}
      />
    </div>
  );
}

export default PendingStage;
