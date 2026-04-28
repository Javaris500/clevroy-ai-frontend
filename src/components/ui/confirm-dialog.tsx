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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
 * Layout_Enhancements B.26 — on `<md` viewports the surface switches from a
 * centered Dialog to a bottom Sheet. iOS users expect bottom sheets for
 * confirmations (a centered modal with a backdrop tap-to-dismiss feels web,
 * not native). The same prop API drives both surfaces; the only consumer
 * change is "now you get a native-feeling sheet on mobile for free." Affects
 * every caller: reshoot confirm, delete confirm, cancel-generation, sign-out
 * during generation, account delete.
 *
 * On the focus model:
 *   - Default focus lands on the cancel button (safer outcome wins).
 *   - Escape closes the surface without firing onConfirm.
 *   - Enter inside the surface activates the focused button only.
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
  const isMobile = useIsMobile();

  const handleConfirm = async () => {
    await onConfirm();
  };

  const buttons = (
    <>
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
    </>
  );

  // Render-once branch on viewport so each surface keeps its own focus trap
  // and animation primitives intact. shadcn's Sheet already wraps Radix's
  // dialog primitives so accessibility (focus trap, escape, aria-modal) is
  // identical between the two — only the visual treatment differs.
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          // Phone bottom sheet — pulled-up corners, room above the home
          // indicator. The shadcn primitive itself respects safe-area on its
          // children; we just pad the bottom for the indicator strip.
          className="rounded-t-xl pb-[max(env(safe-area-inset-bottom,0px),16px)]"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {body ? <SheetDescription>{body}</SheetDescription> : null}
          </SheetHeader>
          <SheetFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {buttons}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {body ? <DialogDescription>{body}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>{buttons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
