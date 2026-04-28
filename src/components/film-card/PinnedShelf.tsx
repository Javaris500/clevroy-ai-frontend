"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { projects } from "@/lib/copy";
import { isFilmInProgress, type FilmSummary } from "@/types/film";

import { FilmCard } from "./film-card";
import { useSeenFilms } from "./use-seen-films";

/**
 * Pinned shelf for /projects (Settings_Projects_Brief A.4.2 + A.7 §1).
 *
 * Renders only when the user already has six films OR there's a film
 * mid-pipeline — below that threshold the grid IS the page and a shelf
 * would be redundant noise.
 *
 * Composition:
 *   - Eyebrow: "Right now" in Fraunces italic when there's an in-progress
 *     film (with a soft motion-safe pulse next to "now"). Otherwise
 *     "Recent" in mono caption style.
 *   - Row: in-progress card first (one max), then up to 3 most-recent
 *     non-in-progress films. Horizontal scroll with `snap-x` so the row
 *     reads like a shelf rather than a wall.
 *
 * The shelf does not respond to status filters — its job is "what is the
 * user working on / what was finished most recently," not a filtered view.
 * Filter chips below the toolbar still filter the main grid.
 */
export interface PinnedShelfProps {
  /** Already-loaded films (the same array the grid renders from). */
  films: ReadonlyArray<FilmSummary>;
  /** The single in-progress film, if any. */
  inProgressFilm?: FilmSummary | null;
  onRename?: (film: FilmSummary) => void;
  onDuplicate?: (film: FilmSummary) => void;
  onDelete?: (film: FilmSummary) => void;
}

const RECENT_LIMIT = 3;
const TOTAL_THRESHOLD = 6;

export function PinnedShelf({
  films,
  inProgressFilm,
  onRename,
  onDuplicate,
  onDelete,
}: PinnedShelfProps) {
  const { isSeen, markSeen } = useSeenFilms();

  const hasInProgress = !!inProgressFilm;
  const totalKnown = films.length;

  // Don't render below the threshold.
  if (!hasInProgress && totalKnown < TOTAL_THRESHOLD) return null;

  // Recent: the most recent N non-in-progress films, newest first. The grid
  // hands us an already-sorted "Newest first" list as long as the page is on
  // its default sort; we re-sort defensively in case a different sort is
  // active so the shelf still reads as recency.
  const recent = [...films]
    .filter((f) => !isFilmInProgress(f.state))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, RECENT_LIMIT);

  const shelfFilms: ReadonlyArray<FilmSummary> = inProgressFilm
    ? [inProgressFilm, ...recent]
    : recent;

  if (shelfFilms.length === 0) return null;

  return (
    <section
      aria-label={hasInProgress ? projects.shelf.rightNow : projects.shelf.recent}
      className="flex flex-col gap-3"
    >
      {hasInProgress ? <RightNowEyebrow /> : <RecentEyebrow />}

      <div
        // Horizontal scroll row with snap. -mx-2 / px-2 lets cards bleed to
        // the page edge on mobile so the shelf reads as a continuing strip.
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2",
          "-mx-2 px-2",
          "[scrollbar-width:thin]",
        )}
      >
        {shelfFilms.map((film) => (
          <div
            key={film.id}
            className={cn(
              "snap-start shrink-0",
              // Mobile: ~64vw cards so the next card peeks into view and the
              // user knows the row scrolls. Desktop: fixed 22rem so the row
              // shows three at typical widths without dominating the page.
              "w-[64vw] sm:w-[22rem]",
            )}
          >
            <FilmCard
              film={film}
              size="lg"
              isNew={film.state === "complete" && !isSeen(film.id)}
              onOpen={(f) => markSeen(f.id)}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function RightNowEyebrow() {
  return (
    <p className="text-phase italic text-foreground">
      {projects.shelf.rightNow.split(" ")[0]}{" "}
      <span className="relative inline-flex items-center">
        {projects.shelf.rightNow.split(" ")[1]}
        <span
          aria-hidden="true"
          className={cn(
            "ml-1.5 inline-block size-1.5 rounded-full bg-primary",
            "motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]",
          )}
        />
      </span>
    </p>
  );
}

function RecentEyebrow() {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      {projects.shelf.recent}
    </p>
  );
}
