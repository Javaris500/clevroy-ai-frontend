"use client";

import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { inProgressIndicator as copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useInProgressFilm } from "@/hooks/use-films";
import { isFilmInProgress } from "@/types/film";
import type { FilmSummary } from "@/types/api";

const USE_HARDCODED = process.env.NEXT_PUBLIC_USE_HARDCODED === "true";

/** Hardcoded fixture for local-dev-without-a-backend mode. Flip to `null`
 * to demo the no-active-film state. */
const FIXTURE_IN_PROGRESS: FilmSummary | null = {
  id: "fixture-film-active",
  title: "The Last Reel",
  state: "scene_images_pending",
  created_at: "2026-04-24T18:50:00Z",
  completed_at: null,
  scene_count: 7,
  duration_seconds: null,
  cover_image_url: null,
};

/**
 * Returns whether the user currently has a film mid-pipeline. Read by
 * ProfileChip's EC-N4 sign-out confirmation gate and the Recent films group's
 * "Shooting" treatment. Single source of truth — components shouldn't
 * subscribe to the underlying hook independently.
 *
 * The hook is always called (no early-return) so the rules-of-hooks invariant
 * holds; the fixture branch only short-circuits the *value* the hook returns.
 */
export function useHasInProgressFilm(): boolean {
  const q = useInProgressFilm();
  if (USE_HARDCODED) {
    return FIXTURE_IN_PROGRESS != null && isFilmInProgress(FIXTURE_IN_PROGRESS.state);
  }
  return q.data != null && isFilmInProgress(q.data.state);
}

export interface InProgressIndicatorProps {
  /** When `forceShow` is set, the dot renders regardless of the live state.
   * Used for Storybook / fixture testing. Otherwise the indicator is driven
   * by `useHasInProgressFilm()`. */
  forceShow?: boolean;
  className?: string;
}

/**
 * Small primary-colored dot that signals an in-progress film. Anchored
 * top-right of its parent via absolute positioning — caller must establish
 * a `relative` containing block. Hidden when no film is mid-pipeline so
 * the dot disappears the moment generation completes (EC-G10).
 *
 * The visible dot is decorative (`aria-hidden`) but a sibling visually-hidden
 * span carries the announcement so screen readers still know (CC-5).
 */
export function InProgressIndicator({
  forceShow = false,
  className,
}: InProgressIndicatorProps) {
  const live = useHasInProgressFilm();
  const visible = forceShow || live;
  if (!visible) return null;

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-1.5 top-1.5 size-2 rounded-full bg-primary",
          // Soft pulsing halo to match the live-event affordance used elsewhere.
          "ring-2 ring-primary/30",
          "motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]",
          className,
        )}
      />
      <span className="sr-only">{copy.ariaLabel}</span>
    </>
  );
}

/**
 * B.25 — token-perfect skeleton for `<InProgressIndicator />`. The live
 * indicator deliberately renders nothing while the in-progress query is in
 * flight (a placeholder dot would be a false positive — the user might not
 * have a film mid-pipeline). This Skeleton variant exists for callers that
 * want to reserve the dot's footprint during loading regardless; it shares
 * the same absolute positioning so the parent must establish a `relative`
 * containing block.
 */
export function InProgressIndicatorSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-1.5 top-1.5 size-2 rounded-full",
        className,
      )}
    />
  );
}
