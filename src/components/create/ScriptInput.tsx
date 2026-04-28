"use client";

// Script textarea for the Create input phase. shadcn Textarea + auto-grow +
// char counter + aria-describedby help line — Layout_Enhancements A.11. The
// brief starts compact (~8 rows) so /create reads as one decision and grows
// with the user's content; the resize handle is removed because the field
// resizes itself.

import { useCallback, useEffect, useRef } from "react";

import { Textarea } from "@/components/ui/textarea";
import { createPage } from "@/lib/copy";
import { cn } from "@/lib/utils";

export type ScriptInputProps = {
  value: string;
  onChange: (next: string) => void;
  /** Min characters required before the CTA enables. Design_System §7.4. */
  minChars: number;
  /** Mobile keyboard handling — when true, the textarea uses the iOS-friendly
   * scroll-into-view-on-focus behavior. Always true on touch devices. */
  scrollIntoViewOnFocus?: boolean;
};

// Compact starting height — the field grows as the user types. ~8 rows of
// the body type-scale. Cap is `--max-h` to prevent the field from eating the
// whole panel; the textarea scrolls beyond that.
const MIN_HEIGHT_PX = 200;
const MAX_HEIGHT_PX = 600;

export function ScriptInput({
  value,
  onChange,
  minChars,
  scrollIntoViewOnFocus = true,
}: ScriptInputProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow: clear inline height, measure scrollHeight, clamp into the
  // [MIN, MAX] band, then write the resolved height back. Runs on every
  // value change. Beyond MAX the textarea scrolls naturally.
  const recalc = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(MAX_HEIGHT_PX, Math.max(MIN_HEIGHT_PX, el.scrollHeight));
    el.style.height = `${next}px`;
  }, []);

  useEffect(() => {
    recalc();
  }, [value, recalc]);

  // Recalc once on mount so the initial render lands at MIN_HEIGHT_PX even
  // if the browser computed a different default height.
  useEffect(() => {
    recalc();
  }, [recalc]);

  return (
    <div className="space-y-2">
      <label htmlFor="clevroy-script" className="sr-only">
        {createPage.textareaAriaLabel}
      </label>
      <Textarea
        ref={ref}
        id="clevroy-script"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={createPage.textareaPlaceholder}
        // The character helper below is the canonical aria-described region.
        // Films surface language per Brand_Guide §5.3 — never "credits".
        aria-describedby="clevroy-script-helper"
        spellCheck
        autoComplete="off"
        rows={8}
        className={cn(
          // Auto-grow: no fixed min-h class, no resize handle. JS owns the
          // height via the inline style set by `recalc`.
          "resize-none overflow-y-auto",
          "rounded-lg border border-border bg-card",
          "px-4 py-3 text-body leading-7",
          "font-sans",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        style={{
          minHeight: `${MIN_HEIGHT_PX}px`,
          maxHeight: `${MAX_HEIGHT_PX}px`,
        }}
        onFocus={(e) => {
          if (!scrollIntoViewOnFocus) return;
          // Mobile keyboard handling per Design_System §10.4. scrollIntoView
          // with center keeps the focused area visible above the on-screen
          // keyboard.
          requestAnimationFrame(() => {
            try {
              e.target.scrollIntoView({ block: "center", behavior: "smooth" });
            } catch {
              // Older browsers may not support smooth — silently ignore.
            }
          });
        }}
      />
      <p
        id="clevroy-script-helper"
        className="text-small text-muted-foreground"
        aria-live="polite"
      >
        {createPage.charCount(value.length, minChars)}
      </p>
    </div>
  );
}

export default ScriptInput;
