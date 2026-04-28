"use client";

// Zone 1 — full-bleed MP4 player + film metadata row.
// Design_System §7.5. Brand voice via copy.ts.
//
// Owns:
//   - Signed-URL playback fetch (useFilmPlaybackUrl on mount).
//   - Editable title on click → useRenameFilm. Save on blur or Enter; cancel
//     on Escape. The shadcn Input takes over the H1's slot during edit.
//   - Metadata row: scene count · duration · "Created {date}".
//   - Take-It-Home dropdown (right side).
//   - Disabled Share v1.1 stub with tooltip (Brand_Guide §6.3 — no "Coming soon").
//
// Exposes a stable `playerRef` via forwardRef so Zone 2's SceneStrip can scrub
// the player when a thumbnail is clicked.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Pencil, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TakeItHomeMenu } from "@/components/exports";
import { useRenameFilm } from "@/hooks/use-films";
import { useFilmPlaybackUrl } from "@/components/exports/use-exports";
import { resultsHero } from "@/lib/copy";
import { ApiError } from "@/types/api";

import type { FilmDetails } from "./types";

export interface HeroPlayerHandle {
  /** Scrub the underlying <video> element to a specific time (seconds).
   *  Used by Zone 2's SceneStrip onSceneSelect callback. */
  scrubTo: (seconds: number) => void;
}

export interface HeroPlayerProps {
  film: FilmDetails;
  /** Hides Take-it-home + Share when the film isn't `complete`. */
  exportable?: boolean;
}

/** ISO 8601 → "April 24, 2026" — call-site formatting only, never coerce
 *  the original ISO string to Date for sort math (per Leon's note in
 *  src/types/film.ts). */
function formatCreatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const HeroPlayer = forwardRef<HeroPlayerHandle, HeroPlayerProps>(
  function HeroPlayer({ film, exportable = true }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [editing, setEditing] = useState(false);
    const [draftTitle, setDraftTitle] = useState(film.title);
    const playback = useFilmPlaybackUrl(film.id, { enabled: exportable });
    const rename = useRenameFilm();

    // Keep draft in sync with incoming film when editing isn't active.
    useEffect(() => {
      if (!editing) setDraftTitle(film.title);
    }, [film.title, editing]);

    useImperativeHandle(
      ref,
      () => ({
        scrubTo(seconds: number) {
          const v = videoRef.current;
          if (!v) return;
          const target = Math.max(0, seconds);
          v.currentTime = target;
          // Resume play if we were already playing — otherwise seek-only is
          // friendlier than auto-play surprises.
          if (!v.paused) {
            void v.play().catch(() => undefined);
          }
        },
      }),
      [],
    );

    const commitTitle = useCallback(() => {
      const trimmed = draftTitle.trim();
      if (!trimmed || trimmed === film.title) {
        setDraftTitle(film.title);
        setEditing(false);
        return;
      }
      rename.mutate(
        { id: film.id, title: trimmed },
        {
          onSuccess: () => {
            setEditing(false);
          },
          onError: (err: ApiError) => {
            // Brand-voice: name what failed, no "Oops".
            toast.warning("Title didn't save.", {
              description: err.message || "Try again in a moment.",
            });
            setDraftTitle(film.title);
            setEditing(false);
          },
        },
      );
    }, [draftTitle, film.id, film.title, rename]);

    const onTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitTitle();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setDraftTitle(film.title);
        setEditing(false);
      }
    };

    const onTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
      setDraftTitle(event.target.value);
    };

    const playbackUrl = playback.data?.url;
    const showFallback = exportable && !playbackUrl && !playback.isLoading;

    return (
      <section aria-labelledby="film-title" className="space-y-5">
        {/* Player */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          {playbackUrl ? (
            <video
              ref={videoRef}
              key={playbackUrl}
              src={playbackUrl}
              poster={film.cover_image_url ?? undefined}
              controls
              preload="metadata"
              className="h-full w-full"
            />
          ) : showFallback ? (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-small text-white/80">
              {resultsHero.playerUnavailable}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-small text-white/70">
              {resultsHero.playerLoading}
            </div>
          )}
        </div>

        {/* Title row + metadata + actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            {editing ? (
              <Input
                autoFocus
                value={draftTitle}
                onChange={onTitleChange}
                onBlur={commitTitle}
                onKeyDown={onTitleKeyDown}
                disabled={rename.isPending}
                aria-label={resultsHero.titleAriaLabel}
                aria-busy={rename.isPending}
                className="text-h1 font-serif"
              />
            ) : (
              <button
                id="film-title"
                type="button"
                onClick={() => setEditing(true)}
                aria-label={resultsHero.titleAriaLabel}
                className="group flex max-w-full items-baseline gap-2 truncate text-h1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <span className="truncate font-serif">{film.title}</span>
                <Pencil
                  className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </button>
            )}

            <p className="text-small text-muted-foreground">
              <span>{resultsHero.scenes(film.scene_count)}</span>
              <span className="mx-2" aria-hidden>
                ·
              </span>
              <span>{formatDuration(film.duration_seconds)}</span>
              <span className="mx-2" aria-hidden>
                ·
              </span>
              <span>
                {resultsHero.createdLabel} {formatCreatedAt(film.created_at)}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Disabled buttons don't fire pointer events; wrap in a span
                   *  so the Tooltip still anchors. */}
                  <span tabIndex={0}>
                    <Button variant="outline" disabled aria-disabled="true">
                      <Share2
                        className="size-4"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      {resultsHero.shareLabel}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{resultsHero.shareTooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TakeItHomeMenu filmId={film.id} disabled={!exportable} />
          </div>
        </div>
      </section>
    );
  },
);

export default HeroPlayer;
