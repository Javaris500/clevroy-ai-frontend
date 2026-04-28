"use client";

// Zone 2 — scene strip + per-scene actions row + Reshoot dialog state.
// Click a thumbnail in Nemi's <SceneStrip mode="browse" /> → scrub the hero
// player to the start of that scene. The start time is the running sum of
// previous scenes' duration_seconds (the final concat preserves order; clips
// are joined with stream-copy per Backend_Handoff §13.3, so timeline math is
// linear).

import { useMemo, useState } from "react";

import { SceneStrip, type SceneStripScene } from "@/components/scene-strip";
import { ReshootSceneDialog } from "@/components/reshoot/ReshootSceneDialog";
import type { Scene, SceneState } from "@/types/api";
import type { SceneStatus } from "@/types/film-state";

import { SceneActionsRow } from "./SceneActionsRow";
import type { HeroPlayerHandle } from "./HeroPlayer";

export interface ZoneTwoProps {
  filmId: string;
  scenes: Scene[];
  /** Title is read for the SceneStrip thumbnail alt text fallback. */
  filmTitle: string;
  /** Forwarded ref to the HeroPlayer so click-to-scrub works without lifting
   *  state into the page. */
  playerRef: React.RefObject<HeroPlayerHandle | null>;
  /** When true, three-dot menu's Reshoot item is enabled. False during
   *  in-progress states or while the film hasn't reached `complete`. */
  reshootEnabled: boolean;
  /** Called when the menu's "View characters" is selected. The page handles
   *  scrolling Zone 3 to the Characters tab. */
  onViewCharacters: (scene: Scene) => void;
}

const SCENE_STATE_TO_STATUS: Record<SceneState, SceneStatus> = {
  pending: "pending",
  image_ready: "ready",
  assembled: "ready",
  failed: "error",
};

/** Cumulative start times in seconds for each scene index. Mirrors the
 *  ordering of the final concat in Backend_Handoff §4 step 9. */
function buildStartTimes(scenes: Scene[]): number[] {
  const times: number[] = [];
  let acc = 0;
  for (const scene of scenes) {
    times.push(acc);
    acc += scene.duration_seconds ?? 0;
  }
  return times;
}

export function ZoneTwo({
  filmId,
  scenes,
  filmTitle,
  playerRef,
  reshootEnabled,
  onViewCharacters,
}: ZoneTwoProps) {
  const [reshootTarget, setReshootTarget] = useState<Scene | null>(null);
  // Set of scene ids whose reshoot mutation has fired but Realtime hasn't
  // confirmed yet. Optimistic per EC-G8 — clears when the parent re-fetches
  // and the scene comes back as `pending` upstream.
  const [pendingReshoots, setPendingReshoots] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const stripScenes: SceneStripScene[] = useMemo(
    () =>
      scenes.map((scene) => ({
        id: scene.id,
        sceneNumber: scene.scene_number,
        status: SCENE_STATE_TO_STATUS[scene.state] ?? "empty",
        thumbnailUrl: scene.image_url ?? undefined,
        thumbnailAlt: `${filmTitle} — scene ${scene.scene_number}`,
      })),
    [scenes, filmTitle],
  );

  const startTimes = useMemo(() => buildStartTimes(scenes), [scenes]);

  const onSceneSelect = (selected: SceneStripScene) => {
    const idx = scenes.findIndex((s) => s.id === selected.id);
    if (idx < 0) return;
    playerRef.current?.scrubTo(startTimes[idx] ?? 0);
  };

  const onReshootRequested = (scene: Scene) => {
    setReshootTarget(scene);
  };

  const closeDialog = () => setReshootTarget(null);

  const markPending = (sceneId: string) => {
    setPendingReshoots((prev) => {
      const next = new Set(prev);
      next.add(sceneId);
      return next;
    });
  };

  return (
    <section aria-label="Scenes" className="space-y-2">
      <SceneStrip
        scenes={stripScenes}
        mode="browse"
        onSceneSelect={onSceneSelect}
      />
      <SceneActionsRow
        scenes={scenes}
        reshootEnabled={reshootEnabled}
        pendingSceneIds={pendingReshoots}
        onReshoot={onReshootRequested}
        onViewCharacters={onViewCharacters}
      />
      {reshootTarget ? (
        <ReshootSceneDialog
          open
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
          filmId={filmId}
          sceneId={reshootTarget.id}
          sceneNumber={reshootTarget.scene_number}
          onReshootStarted={() => markPending(reshootTarget.id)}
        />
      ) : null}
    </section>
  );
}

export default ZoneTwo;
