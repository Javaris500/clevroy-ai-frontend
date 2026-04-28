"use client";

// EC-G8 — confirmation dialog for the user-initiated reshoot path.
// Locked copy: "Reshoot this scene? It will use 0.2 films from your balance."
// Verb pair "reshootScene" → Cancel / Reshoot (Brand_Guide §5.4).
//
// On confirm:
//   - Mints a fresh Idempotency-Key (one per click; EC-G6/EC-G8 pattern).
//   - Calls Stratum's useReshootScene with reason="user_initiated".
//   - Closes the dialog optimistically.
//   - On 409 (`scene_already_reshooting`), surfaces the locked toast via
//     Ghost's helper (no in-dialog error noise — the action is dismissive).
//   - On any other error, surfaces a Brand-voice toast naming what failed.
//
// The Reshoot button on the parent (the SceneActionsRow three-dot menu) is
// the one that needs to be disabled while in flight; this dialog only owns
// open/close + confirm.

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { sceneAlreadyReshootingToast } from "@/components/toasts";
import { useReshootScene } from "@/hooks/use-films";
import { reshootConfirm } from "@/lib/copy";
import { ApiError } from "@/types/api";
import { toast } from "sonner";

export interface ReshootSceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filmId: string;
  sceneId: string;
  sceneNumber: number;
  /** Optional callback fired once the mutation resolves successfully (the
   *  parent typically uses it to mark the scene pending in local state until
   *  Realtime catches up). */
  onReshootStarted?: () => void;
}

export function ReshootSceneDialog({
  open,
  onOpenChange,
  filmId,
  sceneId,
  sceneNumber,
  onReshootStarted,
}: ReshootSceneDialogProps) {
  const reshoot = useReshootScene();

  const handleConfirm = () => {
    if (reshoot.isPending) return;
    reshoot.mutate(
      {
        filmId,
        sceneId,
        idempotency_key:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${filmId}-${sceneId}-${Date.now()}`,
        reason: "user_initiated",
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onReshootStarted?.();
        },
        onError: (err: ApiError) => {
          // EC-G8: 409 path uses Ghost's locked toast helper.
          if (err.code === "scene_already_reshooting") {
            sceneAlreadyReshootingToast();
            onOpenChange(false);
            return;
          }
          // Generic Brand-voice failure path. Names the scene rather than
          // saying "Something went wrong" (Brand_Guide §6.3).
          toast.warning(`Scene ${sceneNumber} didn't reshoot.`, {
            description: err.message || "Try again in a moment.",
          });
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (reshoot.isPending) return;
        onOpenChange(next);
      }}
      title={reshootConfirm.title}
      body={reshootConfirm.body}
      verbs="reshootScene"
      destructive={false}
      pending={reshoot.isPending}
      onConfirm={handleConfirm}
    />
  );
}

export default ReshootSceneDialog;
