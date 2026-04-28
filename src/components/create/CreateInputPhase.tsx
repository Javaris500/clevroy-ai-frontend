"use client";

// /create — input phase. Script textarea + style preset row + cost subline +
// primary CTA. Design_System §7.4. EC-N2 zero-films swap is wired through
// the `filmsLeft` prop the parent computes from the balance source of truth.

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { createPage, type StylePresetId } from "@/lib/copy";

import CostPreviewChip from "./CostPreviewChip";
import ScriptInput from "./ScriptInput";
import StylePresetPicker from "./StylePresetPicker";

export type CreateInputPhaseProps = {
  scriptText: string;
  onScriptChange: (next: string) => void;
  styleId: StylePresetId | null;
  onStyleChange: (next: StylePresetId) => void;
  /** Whole-films integer derived from the NUMERIC(8,2) balance string at the
   * call site (Math.floor of parseFloat). Treat 0 specially per EC-N2. */
  filmsLeft: number;
  /** Optional NUMERIC(8,2) balance string. The cost-preview chip
   * (Layout_Enhancements A.10) renders this verbatim — never coerce. When
   * unset the chip shows "≈ 1 film for this video" with no balance suffix. */
  filmsRemainingString?: string;
  /** True while the create-film mutation is in flight. Disables the CTA. */
  pending: boolean;
  /** True if a draft was restored from sessionStorage on mount (EC-N5). */
  draftRestored: boolean;
  /** Mobile sticky-CTA mode — when true, the CTA docks to the bottom of the
   * viewport above the keyboard (Design_System §10.4). Always wires up the
   * desktop layout too; the sticky behavior is purely additive. */
  stickyCtaOnMobile?: boolean;
  onStart: () => void;
  onBuyMoreFilms: () => void;
};

const MIN_CHARS = 50;

export function CreateInputPhase({
  scriptText,
  onScriptChange,
  styleId,
  onStyleChange,
  filmsLeft,
  filmsRemainingString,
  pending,
  draftRestored,
  stickyCtaOnMobile = true,
  onStart,
  onBuyMoreFilms,
}: CreateInputPhaseProps) {
  const outOfFilms = filmsLeft <= 0;
  const longEnough = scriptText.trim().length >= MIN_CHARS;
  const ctaDisabled = pending || (!outOfFilms && !longEnough);

  // Surface the "draft restored" notice for a few seconds.
  useEffect(() => {
    if (!draftRestored) return;
    const t = setTimeout(() => {
      // No-op — visibility is driven by the prop. Parent decides when to
      // unset it. We just keep this hook here so the parent has a hook
      // to coordinate with later.
    }, 2400);
    return () => clearTimeout(t);
  }, [draftRestored]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-h1">{createPage.pageTitle}</h1>
        <p className="text-body text-muted-foreground">{createPage.subline}</p>
      </header>

      {draftRestored ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-border bg-muted px-3 py-2 text-small text-muted-foreground"
        >
          {createPage.draftRestored}
        </p>
      ) : null}

      <ScriptInput
        value={scriptText}
        onChange={onScriptChange}
        minChars={MIN_CHARS}
      />

      <StylePresetPicker value={styleId} onChange={onStyleChange} />

      <div
        className={[
          // Desktop: in-flow. Mobile: sticky to the bottom of the viewport
          // so it sits above the on-screen keyboard (Design_System §10.4).
          "pt-2",
          stickyCtaOnMobile
            ? "sticky bottom-[max(env(safe-area-inset-bottom,0px),12px)] bg-card/80 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-0"
            : "",
        ].join(" ")}
      >
        {/* Layout_Enhancements A.10 — live cost-preview chip. Hidden when
            the user is out of films (EC-N2 empty-state CTA owns that affordance). */}
        <CostPreviewChip
          filmsRemaining={filmsRemainingString}
          hidden={outOfFilms}
        />
        <p className="mt-2 text-small text-muted-foreground">
          {outOfFilms
            ? createPage.outOfFilmsSubline
            : createPage.filmCostSubline(String(filmsLeft))}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {outOfFilms ? (
            <Button onClick={onBuyMoreFilms} variant="default" disabled={pending}>
              {createPage.buyMoreCta}
            </Button>
          ) : (
            <Button
              onClick={onStart}
              disabled={ctaDisabled}
              aria-disabled={ctaDisabled}
              variant="default"
            >
              {createPage.startCta}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateInputPhase;
