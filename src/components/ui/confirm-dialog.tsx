"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  confirmVerbPairs,
  type ConfirmVerbKey,
} from "@/lib/copy";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Headline. Always a complete sentence. Brand_Guide §6: no "Oops". */
  title: React.ReactNode;
  /** Optional second line. Keep it short — "It can't be recovered." style. */
  body?: React.ReactNode;
  /**
   * Pulls the cancel/confirm labels from `confirmVerbPairs` in copy.ts.
   * Defaults to `delete` (Keep it / Delete it) per Brand_Guide §7.5.
   * Pass a different key (e.g. `cancelGeneration`) for matching surfaces.
   */
  verbs?: ConfirmVerbKey;
  /** Override the cancel label without going through the registry. */
  cancelLabel?: React.ReactNode;
  /** Override the confirm label without going through the registry. */
  confirmLabel?: React.ReactNode;
  /**
   * Render the confirm button as destructive (red). Default true when the
   * resolved verbs key is a destructive pair.
   */
  destructive?: boolean;
  /** Disable the confirm button (e.g. while the mutation is in-flight). */
  pending?: boolean;
  /** Fired when the confirm button is activated. */
  onConfirm: () => void | Promise<void>;
}

const DESTRUCTIVE_VERB_KEYS: ReadonlyArray<ConfirmVerbKey> = [
  "delete",
  "cancelGeneration",
  "deleteAccount",
];

/**
 * The single confirmation primitive used across the app — Global_Design_Rules
 * §2.2. Wraps shadcn dialog. Pulls verb pairs from `confirmVerbPairs` so
 * voice stays consistent ("Keep it / Delete it" never drifts to "Cancel /
 * OK").
 *
 * On the focus model:
 *   - Default focus lands on the cancel button (safer outcome wins).
 *   - Escape closes the dialog without firing onConfirm.
 *   - Enter inside the dialog activates the focused button only.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  verbs = "delete",
  cancelLabel,
  confirmLabel,
  destructive,
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const pair = confirmVerbPairs[verbs];
  const resolvedCancel = cancelLabel ?? pair.cancel;
  const resolvedConfirm = confirmLabel ?? pair.confirm;
  const isDestructive =
    destructive ?? DESTRUCTIVE_VERB_KEYS.includes(verbs);

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {body ? <DialogDescription>{body}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {resolvedCancel}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending}
            autoFocus={false}
          >
            {resolvedConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
