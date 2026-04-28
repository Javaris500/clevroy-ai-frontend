"use client";

// EC-G4 — when GET /api/films/{id} returns the film in `state="error"` with a
// scene-level failure, the Results page surfaces this banner above the hero
// player. The reshoot is FREE (`reason: "generation_failure"`); the secondary
// action ("Continue without it") flows through a separate confirmation that
// marks the film Incomplete and triggers a partial refund.
//
// IMPORTANT: the "Continue without it" backend route is not yet specified in
// Backend_Handoff §8 (no endpoint documented for "complete with missing
// scene"). Until the contract lands, the secondary CTA is wired to a TODO
// callback from the parent — the dialog still appears but the actual mutation
// is owned by the parent so Stratum can drop in the real hook later. See
// coordination.md → Kaiser → open question Q1.

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { sceneAlreadyReshootingToast } from "@/components/toasts";
import { useReshootScene } from "@/hooks/use-films";
import { errorRecovery } from "@/lib/copy";
import { ApiError } from "@/types/api";

export interface ErrorRecoveryActionsProps {
  filmId: string;
  /** The first failed scene from the film's scenes array. EC-G4 narrates a
   *  single failure even when the backend pauses on the first error. */
  failedSceneId: string;
  failedSceneNumber: number;
  /** When provided, fired after the free reshoot mutation resolves —
   *  typically used by the parent to mark the scene as pending in local
   *  state until Realtime catches up. */
  onReshootStarted?: () => void;
  /** When provided, fired once the user confirms "Continue without it". The
   *  parent owns the actual finish-incomplete mutation until Stratum ships
   *  one. When omitted, the secondary CTA stays hidden so we don't expose a
   *  control with no behavior. */
  onContinueWithout?: () => void | Promise<void>;
  /** Disables both CTAs (e.g. while the parent is dispatching the reshoot
   *  mutation outside this component). */
  pending?: boolean;
}

export function ErrorRecoveryActions({
  filmId,
  failedSceneId,
  failedSceneNumber,
  onReshootStarted,
  onContinueWithout,
  pending = false,
}: ErrorRecoveryActionsProps) {
  const reshoot = useReshootScene();
  const [continueOpen, setContinueOpen] = useState(false);
  const [continuePending, setContinuePending] = useState(false);

  const isReshootPending = reshoot.isPending || pending;

  const handleReshoot = () => {
    if (isReshootPending) return;
    reshoot.mutate(
      {
        filmId,
        sceneId: failedSceneId,
        idempotency_key:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${filmId}-${failedSceneId}-${Date.now()}`,
        // EC-G4 — generation failure path is free.
        reason: "generation_failure",
      },
      {
        onSuccess: () => {
          onReshootStarted?.();
        },
        onError: (err: ApiError) => {
          if (err.code === "scene_already_reshooting") {
            sceneAlreadyReshootingToast();
            return;
          }
          toast.warning(
            `Scene ${failedSceneNumber} didn't reshoot.`,
            { description: err.message || "Try again in a moment." },
          );
        },
      },
    );
  };

  const handleContinue = async () => {
    if (!onContinueWithout || continuePending) return;
    setContinuePending(true);
    try {
      await onContinueWithout();
      setContinueOpen(false);
    } finally {
      setContinuePending(false);
    }
  };

  const banner = errorRecovery.banner;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 md:p-6"
    >
      <div className="flex items-start gap-4">
        <AlertCircle
          className="mt-0.5 size-5 shrink-0 text-destructive"
          strokeWidth={1.5}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-h3">{banner.title(failedSceneNumber)}</h2>
          <p className="text-body text-muted-foreground">{banner.body}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          variant="default"
          onClick={handleReshoot}
          disabled={isReshootPending}
        >
          {errorRecovery.primary(failedSceneNumber)}
        </Button>
        <span className="text-caption uppercase tracking-wider text-muted-foreground">
          {errorRecovery.freeIndicator}
        </span>
        {onContinueWithout ? (
          <Button
            variant="ghost"
            onClick={() => setContinueOpen(true)}
            disabled={isReshootPending || continuePending}
            className="ml-auto"
          >
            {errorRecovery.secondary}
          </Button>
        ) : null}
      </div>

      {onContinueWithout ? (
        <ConfirmDialog
          open={continueOpen}
          onOpenChange={(next) => {
            if (continuePending) return;
            setContinueOpen(next);
          }}
          title={errorRecovery.continueConfirm.title}
          body={errorRecovery.continueConfirm.body}
          cancelLabel={errorRecovery.continueConfirm.cancel}
          confirmLabel={errorRecovery.continueConfirm.confirm}
          destructive
          pending={continuePending}
          onConfirm={handleContinue}
        />
      ) : null}
    </div>
  );
}

export default ErrorRecoveryActions;
