"use client";

// EC-G6 — Cancel-generation flow.
//   Desktop: a text link in the bottom-right of the generation panel.
//   Mobile:  the whole bottom tab bar is replaced by a 48px-tall Cancel bar
//            that this component also renders (via the `variant` prop).
// Confirmation modal pulls verbs from confirmVerbPairs.cancelGeneration in
// src/lib/copy.ts ("Keep going" / "Stop").

import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelGeneration } from "@/lib/copy";

export type CancelGenerationButtonProps = {
  /** `link` for the desktop bottom-right text link.
   *  `bar`  for the mobile cancel bar (replaces the tab bar during gen). */
  variant: "link" | "bar";
  /** True while the cancel mutation is in flight (≤5s "Stopping..."). */
  pending?: boolean;
  /** Heightened warning (EC-G9 p99) — adds a --color-warning hairline border
   *  to the link / bar so it nudges the user without jumping position. */
  warn?: boolean;
  /** Called when the user confirms cancellation. The parent runs the
   *  mutation and shows the refund toast on success. */
  onConfirm: () => void | Promise<void>;
};

export function CancelGenerationButton({
  variant,
  pending = false,
  warn = false,
  onConfirm,
}: CancelGenerationButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  if (variant === "link") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={pending}
          aria-haspopup="dialog"
          className={[
            // Bottom-right of the generation panel — placement is handled
            // by the parent. This component just paints the link.
            "rounded-md px-3 py-2 text-small text-muted-foreground",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            warn ? "border border-warning" : "border border-transparent",
            pending ? "cursor-not-allowed opacity-70" : "",
          ].join(" ")}
        >
          {pending ? cancelGeneration.stopping : cancelGeneration.link}
        </button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={cancelGeneration.dialogTitle}
          body={cancelGeneration.dialogBody}
          verbs="cancelGeneration"
          pending={pending}
          onConfirm={handleConfirm}
        />
      </>
    );
  }

  // variant === "bar" — mobile cancel bar replacing the tab bar during gen.
  return (
    <>
      <div
        role="toolbar"
        aria-label="Generation controls"
        className={[
          "flex h-12 w-full items-center justify-between gap-3 px-4",
          "border-t border-border bg-card",
          warn ? "border-t-2 border-t-warning" : "",
        ].join(" ")}
      >
        <span className="text-caption text-muted-foreground">
          {cancelGeneration.mobileBarPrefix}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={pending}
          aria-haspopup="dialog"
          className={[
            "rounded-md px-3 py-1.5 text-small font-medium",
            "text-destructive hover:bg-destructive/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            pending ? "cursor-not-allowed opacity-70" : "",
          ].join(" ")}
        >
          {pending ? cancelGeneration.stopping : cancelGeneration.mobileBarCancel}
        </button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={cancelGeneration.dialogTitle}
        body={cancelGeneration.dialogBody}
        verbs="cancelGeneration"
        pending={pending}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default CancelGenerationButton;
