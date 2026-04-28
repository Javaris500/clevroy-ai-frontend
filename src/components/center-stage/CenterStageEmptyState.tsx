"use client";

// <CenterStageEmptyState /> — the no-in-progress-film branch of /home's hero
// (Layout_Enhancements A.4). Co-exported with <CenterStage /> so Session 3's
// /home composition can branch as
//
//   {inProgressFilm ? <CenterStage … /> : <CenterStageEmptyState />}
//
// without owning internals or repeating the panel chrome. Matches the rounded
// card frame + 16:9 aspect of the live stage so /home doesn't reflow when
// the user starts a film.

import Link from "next/link";
import { Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { centerStage, createPage, navLinks } from "@/lib/copy";

export type CenterStageEmptyStateProps = {
  /** Optional — override the default `/create` link. */
  startHref?: string;
  /** Optional className for the outer panel. */
  className?: string;
};

export function CenterStageEmptyState({
  startHref,
  className,
}: CenterStageEmptyStateProps) {
  const href = startHref ?? navLinks.create.href;
  return (
    <section
      role="region"
      aria-label={centerStage.ariaRegionLabel}
      className={[
        "relative w-full overflow-hidden rounded-lg border border-border bg-card",
        className ?? "",
      ].join(" ")}
      style={{ aspectRatio: "16 / 9" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <Clapperboard className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <h2 className="text-h2 text-foreground">{createPage.pageTitle}</h2>
        <p className="max-w-md text-body text-muted-foreground">
          {createPage.subline}
        </p>
        <Button asChild size="lg">
          <Link href={href}>{createPage.startCta}</Link>
        </Button>
      </div>
    </section>
  );
}

export default CenterStageEmptyState;
