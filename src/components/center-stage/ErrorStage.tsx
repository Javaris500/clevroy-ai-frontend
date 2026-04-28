"use client";

// Phase: `error`. Hold the last successful scene as a still frame, with a red
// corner badge and a reshoot CTA pinned to the bottom of the center stage.
// EC-G4 covers the per-scene reshoot path (free for generation failures).

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Scene } from "@/types/api";
import { centerStage } from "@/lib/copy";

export type ErrorStageProps = {
  failedScene: Scene | null;
  lastSuccessfulScene: Scene | null;
  errorReason: string | null;
  onReshoot: () => void;
  onContinueWithout: () => void;
};

export function ErrorStage({
  failedScene,
  lastSuccessfulScene,
  errorReason,
  onReshoot,
  onContinueWithout,
}: ErrorStageProps) {
  const hold = lastSuccessfulScene?.image_url ?? null;

  return (
    <div
      // The phase narration block is the screen-reader source of truth.
      // Errors there announce assertively (CC-5).
      role="region"
      aria-label="Generation error"
      className="relative h-full w-full overflow-hidden bg-background"
    >
      {hold ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={hold} alt="" className="h-full w-full object-cover opacity-80" aria-hidden="true" />
      ) : (
        <div aria-hidden="true" className="h-full w-full bg-muted" />
      )}

      {/* Red corner badge */}
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-destructive-foreground">
        <AlertTriangle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-caption">
          {failedScene
            ? `Scene ${failedScene.scene_number} didn't render`
            : "Hit a problem"}
        </span>
      </div>

      {/* CTAs anchored at the bottom of the stage */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-6 pb-5 pt-12">
        <Button onClick={onReshoot} variant="default">
          {centerStage.reshootSceneCta}
          {failedScene ? ` ${failedScene.scene_number}` : ""}
        </Button>
        <Button onClick={onContinueWithout} variant="outline">
          {centerStage.continueWithoutCta}
        </Button>
      </div>

      {/* Optional inline error detail (kept short — phase narration carries
          the long-form copy). */}
      {errorReason ? (
        <p className="sr-only" aria-live="assertive">
          {errorReason}
        </p>
      ) : null}
    </div>
  );
}

export default ErrorStage;
