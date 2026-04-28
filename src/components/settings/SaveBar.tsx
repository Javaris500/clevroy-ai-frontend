"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { settings } from "@/lib/copy";
import { cn } from "@/lib/utils";

export interface SaveBarProps {
  /** Show the bar when true; animates in from below. */
  dirty: boolean;
  /** Save in flight — disables both buttons, shows a "Saving…" label. */
  pending?: boolean;
  /** Called when the user clicks Save changes. */
  onSave: () => void;
  /** Called when the user clicks Discard. Parent reverts state. */
  onDiscard: () => void;
  className?: string;
}

/**
 * Sticky save toolbar for explicit-save settings sub-routes (account,
 * billing, anywhere a transaction needs an explicit confirmation). Sits at
 * the bottom of the page and slides up under motion-safe when `dirty` flips
 * to true.
 *
 * Pages render <SaveBar> inside their own page body so it dock under the
 * <PagePanel>'s flow; no portal needed.
 */
export function SaveBar({
  dirty,
  pending,
  onSave,
  onDiscard,
  className,
}: SaveBarProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {dirty ? (
        <motion.div
          key="save-bar"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "sticky bottom-4 z-20 mt-8",
            className,
          )}
        >
          <div
            role="region"
            aria-label="Unsaved changes"
            className={cn(
              "mx-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-full",
              "border border-border bg-card px-4 py-2 shadow-lg",
            )}
          >
            <p className="text-sm text-muted-foreground">
              {settings.dirtyToast}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDiscard}
                disabled={pending}
                className="rounded-full"
              >
                {settings.discard}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                disabled={pending}
                className="rounded-full"
              >
                {pending ? settings.saving : settings.saveChanges}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
