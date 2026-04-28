"use client";

// /create — generation phase. Owns the layout that wraps the four streamed
// surfaces from Design_System §8.1:
//   1. CenterStage (Fantem)
//   2. PhaseNarration (Nemi — consumed)
//   3. SceneStrip (Nemi — consumed)
//   4. ActivityFeed (Nemi — consumed)
// Plus the EC-G2 connection banner and the EC-G6 cancel control.

import { useMemo, useState } from "react";

import { ActivityFeed } from "@/components/activity-feed";
import { CenterStage } from "@/components/center-stage";
import { PhaseNarration } from "@/components/phase-narration";
import { SceneStrip, type SceneStripScene } from "@/components/scene-strip";
import type { NarrationContext } from "@/lib/copy";

import CancelGenerationButton from "./CancelGenerationButton";
import ConnectionBanner from "./ConnectionBanner";
import SlowPhaseSubline, { type SlowPhaseLevel } from "./SlowPhaseSubline";
import type { GenerationStream } from "./use-generation-stream";

export type CreateGenerationPhaseProps = {
  filmId: string | null;
  stream: GenerationStream;
  /** True while the cancel mutation is in flight (Stopping…). */
  cancelPending: boolean;
  onCancelConfirmed: () => void | Promise<void>;
  /** EC-G4 — passed through to ErrorStage. */
  onReshoot: () => void;
  onContinueWithout: () => void;
};

export function CreateGenerationPhase({
  filmId,
  stream,
  cancelPending,
  onCancelConfirmed,
  onReshoot,
  onContinueWithout,
}: CreateGenerationPhaseProps) {
  const [slowLevel, setSlowLevel] = useState<SlowPhaseLevel>("normal");

  const snapshot = stream.snapshot;
  const phaseStartedAt = snapshot?.last_event_at ?? null;
  const narrationContext: NarrationContext = useMemo(() => {
    const detail = snapshot?.current_phase_detail ?? {};
    return {
      currentScene:
        typeof detail.current_scene === "number" ? detail.current_scene : undefined,
      totalScenes:
        typeof detail.total_scenes === "number" ? detail.total_scenes : undefined,
      voiceProvider:
        typeof detail.voice_provider === "string" ? detail.voice_provider : undefined,
      musicStyle:
        typeof detail.music_style === "string" ? detail.music_style : undefined,
      errorDetail:
        typeof detail.error_detail === "string" ? detail.error_detail : undefined,
    };
  }, [snapshot]);

  // Map our Scene[] into Nemi's SceneStripScene[] shape. SceneStrip handles
  // its own pulse/border/state visuals; we only translate.
  const stripScenes: SceneStripScene[] = useMemo(() => {
    return stream.scenes.map((s) => ({
      id: s.id,
      sceneNumber: s.scene_number,
      thumbnailUrl: s.image_url ?? undefined,
      thumbnailAlt: undefined,
      status:
        s.state === "image_ready" || s.state === "assembled"
          ? "ready"
          : s.state === "failed"
          ? "error"
          : s.id === stream.activeSceneId
          ? "active"
          : "empty",
    }));
  }, [stream.scenes, stream.activeSceneId]);

  if (!snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <span>Starting your film…</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[80vh] flex-col gap-4">
      {/* EC-G2 connection banner — absolute-positioned at the top of the panel */}
      <ConnectionBanner status={stream.status} />

      {/* Center stage — 60% of panel height per Design_System §8.1 */}
      <div className="flex-[6] min-h-0">
        <CenterStage
          filmId={filmId}
          snapshot={snapshot}
          scenes={stream.scenes}
          characters={stream.characters}
          activeSceneId={stream.activeSceneId}
          activeDialogueLine={stream.activeDialogueLine}
          scriptText={stream.scriptText}
          styleLabel={stream.styleLabel}
          aspectRatio={stream.aspectRatio}
          onReshoot={onReshoot}
          onContinueWithout={onContinueWithout}
        />
      </div>

      {/* Phase narration — 16% per §8.1 */}
      <div className="flex flex-col items-center gap-1">
        <PhaseNarration state={snapshot.state} context={narrationContext} />
        <SlowPhaseSubline
          phaseStartedAt={phaseStartedAt}
          onLevelChange={setSlowLevel}
        />
      </div>

      {/* Scene strip — 8% per §8.1 */}
      <div className="flex-[1] min-h-0">
        <SceneStrip
          scenes={stripScenes}
          mode="live"
          activeSceneId={stream.activeSceneId ?? undefined}
        />
      </div>

      {/* Activity feed — 16% per §8.1 */}
      <div className="flex-[2] min-h-[120px]">
        <ActivityFeed entries={stream.events} />
      </div>

      {/* Desktop cancel link — bottom-right of the panel */}
      <div className="hidden items-center justify-end pt-1 md:flex">
        <CancelGenerationButton
          variant="link"
          pending={cancelPending}
          warn={slowLevel === "p99"}
          onConfirm={onCancelConfirmed}
        />
      </div>

      {/* Mobile cancel bar — replaces the bottom tab bar during generation
          (Design_System §6.3). Sticks to the bottom of the viewport. */}
      <div className="fixed inset-x-0 bottom-0 z-20 md:hidden">
        <CancelGenerationButton
          variant="bar"
          pending={cancelPending}
          warn={slowLevel === "p99"}
          onConfirm={onCancelConfirmed}
        />
      </div>
    </div>
  );
}

export default CreateGenerationPhase;
