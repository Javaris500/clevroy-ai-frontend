"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ThreadMessage } from "@/stores/chat-store";

import { AssetOverflow } from "./AssetOverflow";

/**
 * `asset/scene_playback` renderer (Clevroy_Chat_Surface.md §2.3).
 *
 * Roy's Phase 4 moment — "the single biggest emotional moment in the
 * product" per spec. 16:9 video card. Autoplays muted on first paint;
 * exposes an unmute affordance (top-right Volume icon, 44px touch target).
 *
 * First-unmute tooltip: "Click to hear your film." (Fraunces). Once
 * unmuted, all subsequent `scene_playback` messages in the same thread
 * autoplay unmuted. We persist that flag in sessionStorage keyed
 * "clevroy:playback-unmuted" so it lives across thread re-renders within
 * a single session but resets on a new tab.
 *
 * Mobile (<md): autoplay is unreliable. We render a still poster with a
 * centered "Tap to preview" play overlay; tapping enters fullscreen video.
 * Desktop autoplays muted by default.
 */
export interface ScenePlaybackCardProps {
  message: ThreadMessage;
  onReshoot?: (sceneId: string | undefined) => void;
  onViewCharacters?: () => void;
}

const UNMUTE_FLAG_KEY = "clevroy:playback-unmuted";
const FIRST_UNMUTE_TOOLTIP_KEY = "clevroy:playback-first-unmute-shown";

function readUnmuteFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(UNMUTE_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function writeUnmuteFlag() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(UNMUTE_FLAG_KEY, "1");
  } catch {
    // Quota / private mode — silent.
  }
}

function readFirstUnmuteShown(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(FIRST_UNMUTE_TOOLTIP_KEY) === "1";
  } catch {
    return false;
  }
}

function writeFirstUnmuteShown() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FIRST_UNMUTE_TOOLTIP_KEY, "1");
  } catch {
    // Silent.
  }
}

function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return coarse;
}

export function ScenePlaybackCard({
  message,
  onReshoot,
  onViewCharacters,
}: ScenePlaybackCardProps) {
  const reduceMotion = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const meta = message.metadata ?? {};
  const sceneNumber =
    typeof meta.sceneNumber === "number" ? meta.sceneNumber : null;
  const sceneId = typeof meta.sceneId === "string" ? meta.sceneId : undefined;
  const playbackUrl =
    typeof meta.playbackUrl === "string" ? meta.playbackUrl : "";
  const posterUrl = typeof meta.posterUrl === "string" ? meta.posterUrl : "";

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  // Initialized in an effect so SSR sees `false` and the client picks up
  // the persisted flag once mounted (avoids hydration mismatch).
  const [muted, setMuted] = React.useState(true);
  const [tooltipShown, setTooltipShown] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  // Mobile: video doesn't autoplay; the user taps the poster to enter the
  // playing state. `mobileTapped` flips once and stays true for the lifetime
  // of this card so the user doesn't lose progress on re-renders.
  const [mobileTapped, setMobileTapped] = React.useState(false);

  React.useEffect(() => {
    setMuted(!readUnmuteFlag());
    setTooltipShown(readFirstUnmuteShown());
  }, []);

  function handleToggleMute() {
    const next = !muted;
    setMuted(next);
    if (!next) {
      writeUnmuteFlag();
      if (!tooltipShown) {
        writeFirstUnmuteShown();
        setTooltipShown(true);
      }
    }
  }

  // First-unmute tooltip surface: while the card is muted AND the tooltip
  // hasn't been shown yet, hover/focus the unmute button reveals the
  // Fraunces hint. We use a controlled state instead of the shadcn Tooltip
  // because the spec calls for a one-time-only appearance per session.
  function handleUnmuteHover(open: boolean) {
    if (tooltipShown) return;
    setShowTooltip(open);
  }

  // Mobile play overlay handler. Sets the flag AND immediately tries to
  // play the video; iOS requires the call to be inside the user gesture.
  function handleMobileTap() {
    setMobileTapped(true);
    const v = videoRef.current;
    if (v) {
      v.muted = muted;
      v.play().catch(() => {
        // Autoplay blocked even after gesture — fall back to a no-op;
        // user can tap again or the controls will surface.
      });
    }
  }

  // Mobile: until the user taps, render a poster + play overlay. Desktop
  // (or mobile after first tap): render the actual <video>.
  const showMobilePoster = coarse && !mobileTapped;

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="mr-auto w-full max-w-[36rem]"
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-sm">
        <div className="aspect-video w-full">
          {showMobilePoster ? (
            <button
              type="button"
              onClick={handleMobileTap}
              aria-label={
                sceneNumber != null
                  ? `Play scene ${sceneNumber}`
                  : "Play scene"
              }
              className="group relative size-full"
            >
              {posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-muted" />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-black/30"
              >
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md transition-transform group-active:scale-95">
                  <Play className="ml-0.5 size-6" strokeWidth={1.75} />
                </span>
              </span>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                Tap to preview
              </span>
            </button>
          ) : playbackUrl ? (
            <video
              ref={videoRef}
              src={playbackUrl}
              poster={posterUrl || undefined}
              autoPlay={!coarse}
              muted={muted}
              loop
              playsInline
              controls={false}
              className="size-full bg-black object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
              Playback unavailable
            </div>
          )}
        </div>

        {/* Top-right control cluster: unmute (44px) + overflow (44px). */}
        {!showMobilePoster && playbackUrl ? (
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                aria-label={muted ? "Unmute" : "Mute"}
                aria-pressed={!muted}
                onClick={handleToggleMute}
                onMouseEnter={() => handleUnmuteHover(true)}
                onMouseLeave={() => handleUnmuteHover(false)}
                onFocus={() => handleUnmuteHover(true)}
                onBlur={() => handleUnmuteHover(false)}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full",
                  "bg-background/85 text-foreground transition-colors",
                  "hover:bg-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                )}
              >
                {muted ? (
                  <VolumeX className="size-4" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Volume2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
              {showTooltip && muted && !tooltipShown ? (
                <span
                  role="tooltip"
                  className={cn(
                    "absolute right-0 top-full mt-2 whitespace-nowrap",
                    "rounded-md bg-popover px-3 py-1.5 shadow-md",
                    "font-serif text-sm italic text-popover-foreground",
                  )}
                >
                  Click to hear your film.
                </span>
              ) : null}
            </div>
            <AssetOverflow
              triggerAriaLabel={
                sceneNumber != null
                  ? `Scene ${sceneNumber} actions`
                  : "Scene actions"
              }
              className="bg-background/85 hover:bg-background"
              items={[
                {
                  key: "reshoot",
                  label: "Reshoot this scene",
                  onSelect: () => onReshoot?.(sceneId),
                },
                {
                  key: "characters",
                  label: "View characters",
                  onSelect: () => onViewCharacters?.(),
                },
              ]}
            />
          </div>
        ) : null}
      </div>
      <figcaption className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        {sceneNumber != null ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            Scene {String(sceneNumber).padStart(2, "0")} · Playback
          </span>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            Playback
          </span>
        )}
      </figcaption>
    </motion.figure>
  );
}
