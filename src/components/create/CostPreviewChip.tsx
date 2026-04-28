"use client";

// <CostPreviewChip /> — live cost preview rendered above the primary CTA on
// the Create input phase (Layout_Enhancements A.10).
//
// Bound to the balance store via the parent. The NUMERIC(8,2) balance string
// passes through verbatim — never `Number.parseFloat` here, never any cast
// at the leaf (Frontend_Bootstrap §1, Brand_Guide §5.3, "NUMERIC(8,2) end to
// end" from CLAUDE.md). The whole-films integer used for EC-N2 gating still
// gets computed at the call site; this component only displays.
//
// Hidden when balance is exactly zero — the EC-N2 empty-state CTA is the
// affordance there, and a chip would compete with it.

import { Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { createPage } from "@/lib/copy";
import { cn } from "@/lib/utils";

export type CostPreviewChipProps = {
  /** NUMERIC(8,2) balance string from the user store (e.g. "3.00", "0.40").
   * Pass undefined while loading; the chip renders a placeholder dash. */
  filmsRemaining?: string;
  /** Hide the chip entirely — used by the EC-N2 zero-balance branch. */
  hidden?: boolean;
  className?: string;
};

export function CostPreviewChip({
  filmsRemaining,
  hidden,
  className,
}: CostPreviewChipProps) {
  if (hidden) return null;

  const showBalance =
    typeof filmsRemaining === "string" && filmsRemaining.trim().length > 0;

  // Compose the screen-reader sentence so the chip reads cleanly with the
  // surrounding form. We do NOT just ARIA-label the visual text because "≈"
  // mispronounces on most readers (CC-5).
  const ariaLabel = showBalance
    ? `${createPage.costPreview.ariaLabel} ${createPage.costPreview.balanceAriaLabel(filmsRemaining)}`
    : createPage.costPreview.ariaLabel;

  return (
    <Badge
      variant="outline"
      role="status"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        // Soft red tint — matches the Clevroy "primary-soft" surface
        // language used elsewhere on Sidebar / FilmBalanceBadge.
        "border-transparent bg-primary-soft text-primary",
        // Tabular figures so the balance digits don't reflow as the count
        // changes (Post-30 polish, but cheap to land here).
        "tabular-nums font-medium",
        className,
      )}
    >
      <Coins className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
      <span aria-hidden="true">{createPage.costPreview.label}</span>
      {showBalance ? (
        <span aria-hidden="true" className="text-muted-foreground">
          {createPage.costPreview.balanceSuffix(filmsRemaining)}
        </span>
      ) : null}
    </Badge>
  );
}

export default CostPreviewChip;
