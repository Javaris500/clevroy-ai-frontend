"use client";

// <SceneStrip /> — horizontal row of scene pills around <CenterStage />.
// Spec: Design_System §8.5, accessibility CC-3 (touch targets), CC-4 (roving
// tabindex), CC-5 (aria-labels + state announcements), and EC-G4 (error pill).

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { SceneStatus } from "@/types/film-state";
import { sceneStripAriaLabel, sceneStripStatusLabel } from "@/lib/copy";

import styles from "./scene-strip.module.css";

export type SceneStripScene = {
  id: string;
  sceneNumber: number;
  status: SceneStatus;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
};

export type SceneStripProps = {
  scenes: SceneStripScene[];
  /** 'live' — generation in progress (default). 'browse' — reused on Results. */
  mode?: "live" | "browse";
  /** The scene whose pill should auto-center and carry the red dot in live mode. */
  activeSceneId?: string;
  /** Browse-mode: clicking a pill scrubs the hero player. */
  onSceneSelect?: (scene: SceneStripScene) => void;
  /**
   * Layout axis. `horizontal` (default) is the canonical Design_System §8.5
   * pattern around CenterStage and at the bottom on mobile. `vertical` is the
   * Layout_Enhancements A.14 right-rail variant on /films/[id]: pills stack,
   * arrow-key navigation flips to ArrowUp/Down, and the pill radius bumps to
   * 12px so each scene reads as a stacked card.
   */
  direction?: "horizontal" | "vertical";
  className?: string;
};

export function SceneStrip({
  scenes,
  mode = "live",
  activeSceneId,
  onSceneSelect,
  direction = "horizontal",
  className,
}: SceneStripProps) {
  const isVertical = direction === "vertical";
  const stripRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const liveRegionId = useId();
  const [rovingIndex, setRovingIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncedRef = useRef<Map<string, SceneStatus>>(new Map());

  const activeIndex = useMemo(() => {
    if (!activeSceneId) return -1;
    return scenes.findIndex((s) => s.id === activeSceneId);
  }, [scenes, activeSceneId]);

  // Announce scene-status transitions (e.g. "Scene 3 ready") for screen readers.
  // Throttled implicitly by React batching + aria-live="polite". CC-5.
  useEffect(() => {
    const last = lastAnnouncedRef.current;
    for (const scene of scenes) {
      const prev = last.get(scene.id);
      if (prev !== scene.status) {
        last.set(scene.id, scene.status);
        if (prev !== undefined && scene.status === "ready") {
          setAnnouncement(`Scene ${scene.sceneNumber} ready.`);
        } else if (prev !== undefined && scene.status === "error") {
          setAnnouncement(`Scene ${scene.sceneNumber} didn't render.`);
        }
      }
    }
  }, [scenes]);

  // Auto-scroll to keep the active pill visible. In horizontal mode we center
  // along the inline axis; in vertical mode we center along block instead.
  useEffect(() => {
    if (activeIndex < 0) return;
    const pill = pillRefs.current[activeIndex];
    if (!pill) return;
    pill.scrollIntoView({
      behavior: "smooth",
      block: isVertical ? "center" : "nearest",
      inline: isVertical ? "nearest" : "center",
    });
  }, [activeIndex, isVertical]);

  const focusPill = useCallback((index: number) => {
    const pill = pillRefs.current[index];
    if (pill) pill.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const forwardKey = isVertical ? "ArrowDown" : "ArrowRight";
      const backwardKey = isVertical ? "ArrowUp" : "ArrowLeft";
      let next = index;
      switch (e.key) {
        case forwardKey:
          next = Math.min(index + 1, scenes.length - 1);
          break;
        case backwardKey:
          next = Math.max(index - 1, 0);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = scenes.length - 1;
          break;
        case "Enter":
        case " ":
          if (onSceneSelect) {
            e.preventDefault();
            onSceneSelect(scenes[index]);
          }
          return;
        default:
          return;
      }
      if (next !== index) {
        e.preventDefault();
        setRovingIndex(next);
        focusPill(next);
      }
    },
    [scenes, onSceneSelect, focusPill, isVertical],
  );

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label="Scenes"
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      className={[
        isVertical
          ? "flex flex-col items-stretch gap-2 overflow-y-auto snap-y snap-mandatory"
          : "flex items-center gap-2 overflow-x-auto snap-x snap-mandatory",
        "px-1 py-1",
        // Touch: momentum scroll on iOS; hide scrollbar visually but keep scrollable.
        "[scrollbar-width:none] [-webkit-overflow-scrolling:touch]",
        "[&::-webkit-scrollbar]:hidden",
        className ?? "",
      ].join(" ")}
      data-mode={mode}
      data-direction={direction}
    >
      {scenes.map((scene, index) => {
        const isActive = scene.id === activeSceneId;
        const status: SceneStatus = isActive ? "active" : scene.status;
        const isPulsing = status === "pending" || status === "active";
        const tabIndex = index === rovingIndex ? 0 : -1;
        const interactive = mode === "browse" || status === "ready" || isActive;

        return (
          <button
            key={scene.id}
            ref={(el) => {
              pillRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={sceneStripAriaLabel(scene.sceneNumber, status)}
            tabIndex={tabIndex}
            disabled={!interactive && mode === "live"}
            onFocus={() => setRovingIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onClick={() => {
              if (interactive && onSceneSelect) onSceneSelect(scene);
            }}
            className={[
              // Sizes: 44×44 on mobile (CC-3 floor), 56×56 at >=sm.
              "relative shrink-0 snap-center",
              "h-11 w-11 sm:h-14 sm:w-14",
              // Horizontal: 10px radius per §8.5 (tighter than panel 12px so
              // pills read as pills). Vertical (A.14 right-rail): bump to 12px
              // so each scene reads as a stacked card.
              isVertical ? "rounded-lg" : "rounded-[10px]",
              // Focus ring per CC-4.
              "outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-card]",
              // Background + border by status.
              statusBgClass(status),
              borderClass(status),
              // Overflow clip so thumbnail fills without leaking the border radius.
              "overflow-hidden",
              isPulsing ? styles.pulseBorder : "",
            ].join(" ")}
          >
            {/* Thumbnail (ready + active with image) */}
            {(status === "ready" || (isActive && scene.thumbnailUrl)) &&
            scene.thumbnailUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={scene.thumbnailUrl}
                alt={scene.thumbnailAlt ?? ""}
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            ) : null}

            {/* Empty / pending / error — scene number centered on muted bg. */}
            {status !== "ready" && !(isActive && scene.thumbnailUrl) ? (
              <span
                aria-hidden="true"
                className={[
                  "absolute inset-0 flex items-center justify-center",
                  "text-xs font-medium uppercase tracking-wider",
                  status === "error"
                    ? "text-[--color-destructive-foreground]"
                    : "text-[--color-muted-foreground]",
                ].join(" ")}
              >
                {scene.sceneNumber}
              </span>
            ) : null}

            {/* Scene number overlay on ready thumbnail — bottom-right on dark scrim. */}
            {status === "ready" && scene.thumbnailUrl ? (
              <span
                aria-hidden="true"
                className={[
                  "absolute bottom-0.5 right-0.5",
                  "rounded px-1 py-[1px]",
                  "bg-black/60 text-[10px] font-medium text-white",
                ].join(" ")}
              >
                {scene.sceneNumber}
              </span>
            ) : null}

            {/* Active red dot top-right (color + dot per CC-5). */}
            {isActive ? (
              <span
                aria-hidden="true"
                className={[
                  "absolute right-1 top-1",
                  "h-1.5 w-1.5 rounded-full",
                  "bg-[--color-primary]",
                ].join(" ")}
              />
            ) : null}

            {/* Error icon (!) top-right — color + icon per CC-5 / EC-G4. */}
            {status === "error" ? (
              <span
                aria-hidden="true"
                className={[
                  "absolute right-0.5 top-0.5",
                  "flex h-4 w-4 items-center justify-center",
                  "rounded-full bg-[--color-destructive]",
                  "text-[10px] font-bold leading-none text-[--color-destructive-foreground]",
                ].join(" ")}
              >
                !
              </span>
            ) : null}
          </button>
        );
      })}

      {/* Offscreen live region for scene status transitions. */}
      <div
        id={liveRegionId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only absolute -m-px h-px w-px overflow-hidden border-0 p-0 [clip:rect(0,0,0,0)]"
      >
        {announcement}
      </div>
    </div>
  );
}

function statusBgClass(status: SceneStatus): string {
  switch (status) {
    case "ready":
      return "bg-[--color-muted]"; // fallback behind thumbnail
    case "error":
      return "bg-[--color-primary-soft]";
    case "active":
    case "pending":
    case "empty":
    default:
      return "bg-[--color-muted]";
  }
}

function borderClass(status: SceneStatus): string {
  switch (status) {
    case "pending":
      return "border-2 border-[--color-primary]";
    case "active":
      return "border-2 border-solid border-[--color-primary]";
    case "error":
      return "border-2 border-[--color-destructive]";
    case "ready":
      return "border border-[--color-border]";
    case "empty":
    default:
      return "border border-[--color-border]";
  }
}

export default SceneStrip;
