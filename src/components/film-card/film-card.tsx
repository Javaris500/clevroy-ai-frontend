"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { FilmSummary } from "@/types/film";
import { isFilmInProgress } from "@/types/film";
import { filmCard, phaseCaptionForState, projects } from "@/lib/copy";
import { cn } from "@/lib/utils";

import { DeleteFilmDialog } from "./delete-film-dialog";
import { formatCreatedAt } from "./format";

export type FilmCardSize = "md" | "lg";

type FilmCardProps = {
  film: FilmSummary;
  /** True when the film is freshly completed and the user hasn't opened it
   *  yet. Driven by the parent via use-seen-films.ts so the card stays pure. */
  isNew?: boolean;
  /** Compact variant for the Home recent-films horizontal row. Drops the meta
   *  row to fit more cards in view. */
  compact?: boolean;
  /** Visual size variant. `lg` is used by the /projects pinned shelf
   *  (Settings_Projects_Brief A.4.2) — bumps padding + cover height while
   *  preserving the 12px panel radius. Default `md`. */
  size?: FilmCardSize;
  onRename?: (film: FilmSummary) => void;
  onDuplicate?: (film: FilmSummary) => void;
  onDelete?: (film: FilmSummary) => void;
  /** Called when the user clicks into the film. Parents use this to mark the
   *  card seen so the "New" badge clears immediately on click. */
  onOpen?: (film: FilmSummary) => void;
};

// Presentational card. No data-fetching inside — every mutation is a callback
// the parent wires to Stratum's hooks (useDeleteFilm / useRenameFilm /
// useDuplicateFilm). Keeps the card reviewable in isolation and re-mountable
// inside the future Storybook surface.
//
// Click target rules (UX_Edge_Cases CC-3 / DS §10.2):
//   - Whole card body navigates to /films/{id}.
//   - Three-dot button is its own 44×44 hit area; click stops propagation so
//     opening the menu doesn't also open the film.
//
// Live shooting (Settings_Projects_Brief A.7 §2):
//   - 2px primary-color border ring with motion-safe slow pulse (2.4s) so the
//     card breathes without reading as alarm.
//   - "Shooting" badge stays.
//   - Mono caption beneath the title sourced from `phaseCaptionForState`,
//     truncated to one line.
//
// Error state:
//   - Cover renders grayscale + 70% opacity so the image steps back.
//   - Existing "Didn't render" badge is the visible status.
//   - Inline "Try again" link routes to /films/[id]?retry=1 (Layer 5 owns the
//     retry mutation; today the route handler can no-op).

export function FilmCard({
  film,
  isNew = false,
  compact = false,
  size = "md",
  onRename,
  onDuplicate,
  onDelete,
  onOpen,
}: FilmCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const inProgress = isFilmInProgress(film.state);
  const isError = film.state === "error";
  const isLg = size === "lg";

  const handleOpen = () => onOpen?.(film);

  const handleDeleteRequest = () => {
    if (inProgress) return; // EC-N9 — guarded again at menu level below.
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    setDeleteOpen(false);
    onDelete?.(film);
  };

  const meta = (
    <div className="flex items-center gap-2 text-small text-muted-foreground">
      <span>{filmCard.cardAriaSuffix(film.scene_count)}</span>
      <span aria-hidden="true">·</span>
      <span>{formatCreatedAt(film.created_at)}</span>
    </div>
  );

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors",
        "hover:bg-accent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        // Live-shooting ring. The slow 2.4s pulse keeps the card "alive"
        // without competing with the in-progress dot in the sidebar.
        inProgress &&
          "ring-2 ring-primary/40 motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]",
      )}
      aria-label={`${film.title}. ${filmCard.cardAriaSuffix(film.scene_count)}.`}
    >
      <Link
        href={`/films/${film.id}`}
        onClick={handleOpen}
        className="flex flex-col focus:outline-none"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted",
            isLg ? "aspect-video" : "aspect-video",
          )}
        >
          {film.cover_image_url ? (
            // Plain <img> is fine here — covers come from R2 with signed URLs
            // and we don't want next/image's optimization layer for them.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={film.cover_image_url}
              alt=""
              className={cn(
                "h-full w-full object-cover",
                isError && "grayscale opacity-70",
              )}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {/* Top-right badge stack. "New" wins over "Incomplete" wins over
              "Shooting" so users see the most actionable state first. */}
          <div className="absolute right-2 top-2 flex gap-1">
            {isNew && film.state === "complete" && !film.is_incomplete ? (
              <Badge className="bg-primary text-primary-foreground">
                {filmCard.newBadge}
              </Badge>
            ) : null}
            {film.is_incomplete ? (
              <Badge variant="secondary">{filmCard.incompleteBadge}</Badge>
            ) : null}
            {inProgress ? (
              <Badge variant="secondary" className="gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]"
                  aria-hidden="true"
                />
                {filmCard.inProgressBadge}
              </Badge>
            ) : null}
            {isError ? (
              <Badge variant="destructive">{projects.filter.error}</Badge>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col",
            isLg ? "gap-1.5 p-4" : "gap-1 p-3",
          )}
        >
          <h3
            className={cn(
              "font-semibold text-card-foreground line-clamp-1",
              isLg ? "text-h2" : "text-h3",
            )}
          >
            {film.title}
          </h3>
          {inProgress ? (
            <p
              className="line-clamp-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              aria-live="polite"
            >
              {phaseCaptionForState(film.state)}
            </p>
          ) : !compact ? (
            meta
          ) : null}
        </div>
      </Link>

      {/* Inline error recovery action. Routes to /films/[id]?retry=1; the
          retry mutation is owned by Layer 5. The link sits outside the
          card-body Link so it doesn't accidentally swallow the open click. */}
      {isError ? (
        <div className="px-3 pb-3 -mt-1">
          {/* TODO(layer-5): wire ?retry=1 to a real reshoot mutation. */}
          <Link
            href={`/films/${film.id}?retry=1`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary",
              "underline-offset-4 hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            {projects.tryAgain}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}

      {/* Overflow menu sits absolutely so the card body remains a single
          link target. Hit area is 44×44 via the size-11 utility. */}
      <div className="absolute right-2 bottom-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-full bg-card/80 backdrop-blur hover:bg-accent"
              aria-label={`More actions for ${film.title}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onSelect={() => onRename?.(film)}
              disabled={!onRename}
            >
              {filmCard.menu.rename}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onDuplicate?.(film)}
              disabled={!onDuplicate}
            >
              {filmCard.menu.duplicate}
            </DropdownMenuItem>
            <DeleteMenuItem
              inProgress={inProgress}
              onSelect={handleDeleteRequest}
              disabled={!onDelete}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteFilmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
      />
    </article>
  );
}

// EC-N9: Delete is *blocked* (not just confirm-blocked) while a film is
// mid-pipeline. The menu item stays visible but disabled, with a tooltip
// explaining why. The user must Cancel first.
function DeleteMenuItem({
  inProgress,
  onSelect,
  disabled,
}: {
  inProgress: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  if (inProgress) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* span wrapper — disabled MenuItem can't be hovered to fire the tooltip directly */}
            <span>
              <DropdownMenuItem
                disabled
                onSelect={(e) => e.preventDefault()}
                className="text-muted-foreground"
              >
                {filmCard.menu.delete}
              </DropdownMenuItem>
            </span>
          </TooltipTrigger>
          <TooltipContent side="left">
            {filmCard.deleteDisabledTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      disabled={disabled}
      className="text-destructive focus:text-destructive"
    >
      {filmCard.menu.delete}
    </DropdownMenuItem>
  );
}
