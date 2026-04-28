"use client";

// <CenterStage /> — the phase-aware content surface. One sub-component per
// backend state from Design_System §8.4, with a 300ms crossfade between them.
// Visual-only: the phase narration block above carries the canonical
// screen-reader announcement (CC-5).

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import type {
  Character,
  DialogueLine,
  FilmStateSnapshot,
  Scene,
} from "@/types/api";
import { centerStage } from "@/lib/copy";

import PendingStage from "./PendingStage";
import ParsingStage from "./ParsingStage";
import CharacterRefsStage from "./CharacterRefsStage";
import SceneImagesStage from "./SceneImagesStage";
import VoiceSynthesisStage from "./VoiceSynthesisStage";
import MusicCompositionStage from "./MusicCompositionStage";
import SceneAssemblyStage from "./SceneAssemblyStage";
import FinalConcatStage from "./FinalConcatStage";
import CompleteStage from "./CompleteStage";
import ErrorStage from "./ErrorStage";

export type CenterStageProps = {
  filmId: string | null;
  snapshot: FilmStateSnapshot;
  scenes: Scene[];
  characters: Character[];
  activeSceneId: string | null;
  activeDialogueLine: DialogueLine | null;
  scriptText: string;
  styleLabel: string | null;
  /** Aspect ratio string ("16:9" | "9:16" | "1:1" | "4:5"). Drives the
   * panel ratio once parsing completes (Design_System §8.1). */
  aspectRatio: string;
  /** EC-G4 — bound by Fantem's create page. Free reshoot. */
  onReshoot: () => void;
  /** EC-G4 — assembles the film with a 1s black intertitle. */
  onContinueWithout: () => void;
  errorReason?: string | null;
};

const RATIO_TO_PADDING: Record<string, string> = {
  "16:9": "56.25%",
  "9:16": "177.78%",
  "1:1": "100%",
  "4:5": "125%",
};

export function CenterStage({
  filmId,
  snapshot,
  scenes,
  characters,
  activeSceneId,
  activeDialogueLine,
  scriptText,
  styleLabel,
  aspectRatio,
  onReshoot,
  onContinueWithout,
  errorReason,
}: CenterStageProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  // 16:9 is the default until the parse phase completes; after that the
  // user's chosen aspect ratio drives the box.
  const ratio = useMemo(() => {
    if (snapshot.state === "pending" || snapshot.state === "parsing") return "16:9";
    return aspectRatio;
  }, [snapshot.state, aspectRatio]);
  const paddingTop = RATIO_TO_PADDING[ratio] ?? RATIO_TO_PADDING["16:9"];

  const failedScene = useMemo(
    () => scenes.find((s) => s.state === "failed") ?? null,
    [scenes],
  );
  const lastSuccessful = useMemo(() => {
    for (let i = scenes.length - 1; i >= 0; i--) {
      const s = scenes[i];
      if (s.state === "image_ready" || s.state === "assembled") return s;
    }
    return null;
  }, [scenes]);

  const child = renderStageFor({
    state: snapshot.state,
    scenes,
    characters,
    activeSceneId,
    activeDialogueLine,
    scriptText,
    styleLabel,
    failedScene,
    lastSuccessful,
    filmId,
    onReshoot,
    onContinueWithout,
    errorReason: errorReason ?? null,
    prefersReducedMotion,
  });

  // 300ms crossfade per Design_System §8.4 ("transition between states is a
  // 450ms crossfade" — that 450ms is the phase narration text crossfade
  // (Nemi). The panel content swap is the 300ms specified in §14).
  const fade = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }
    : { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } }, exit: { opacity: 0, transition: { duration: 0.2 } } };

  return (
    <section
      // Visual region — the phase narration is the source of truth for
      // screen readers (CC-5). Mark this hidden so motion isn't announced.
      role="region"
      aria-label={centerStage.ariaRegionLabel}
      className="relative w-full overflow-hidden rounded-lg border border-border bg-card"
      style={{ paddingTop }}
    >
      <div className="absolute inset-0">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={stageKey(snapshot.state)}
            {...fade}
            className="absolute inset-0"
          >
            {child}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// `stageKey` collapses cie_building + character_refs into one motion key so
// the crossfade doesn't fire twice when the backend state advances between
// two visually-identical phases.
function stageKey(state: FilmStateSnapshot["state"]): string {
  if (state === "cie_building" || state === "character_refs") return "characters";
  return state;
}

interface StageRenderArgs {
  state: FilmStateSnapshot["state"];
  scenes: Scene[];
  characters: Character[];
  activeSceneId: string | null;
  activeDialogueLine: DialogueLine | null;
  scriptText: string;
  styleLabel: string | null;
  failedScene: Scene | null;
  lastSuccessful: Scene | null;
  filmId: string | null;
  onReshoot: () => void;
  onContinueWithout: () => void;
  errorReason: string | null;
  prefersReducedMotion: boolean;
}

function renderStageFor(args: StageRenderArgs) {
  const {
    state,
    scenes,
    characters,
    activeSceneId,
    activeDialogueLine,
    scriptText,
    styleLabel,
    failedScene,
    lastSuccessful,
    filmId,
    onReshoot,
    onContinueWithout,
    errorReason,
    prefersReducedMotion,
  } = args;

  switch (state) {
    case "pending":
      return <PendingStage prefersReducedMotion={prefersReducedMotion} />;
    case "parsing":
      return (
        <ParsingStage
          scriptText={scriptText}
          prefersReducedMotion={prefersReducedMotion}
        />
      );
    case "cie_building":
    case "character_refs":
      return (
        <CharacterRefsStage
          characters={characters}
          prefersReducedMotion={prefersReducedMotion}
        />
      );
    case "scene_images_pending":
      return (
        <SceneImagesStage
          scenes={scenes}
          activeSceneId={activeSceneId}
          prefersReducedMotion={prefersReducedMotion}
        />
      );
    case "voice_synthesis": {
      const scene = scenes.find((s) => s.id === activeSceneId) ?? scenes[0] ?? null;
      const character =
        characters.find((c) => c.id === activeDialogueLine?.character_id) ?? null;
      return (
        <VoiceSynthesisStage
          scene={scene}
          line={activeDialogueLine}
          character={character}
          prefersReducedMotion={prefersReducedMotion}
        />
      );
    }
    case "music_composition":
      return (
        <MusicCompositionStage
          scenes={scenes}
          styleLabel={styleLabel}
          prefersReducedMotion={prefersReducedMotion}
        />
      );
    case "scene_assembly": {
      const scene = scenes.find((s) => s.id === activeSceneId) ?? scenes[0] ?? null;
      return <SceneAssemblyStage scene={scene} />;
    }
    case "final_concat":
      return (
        <FinalConcatStage
          scenes={scenes}
          prefersReducedMotion={prefersReducedMotion}
        />
      );
    case "complete":
      return <CompleteStage filmId={filmId} scenes={scenes} />;
    case "error":
      return (
        <ErrorStage
          failedScene={failedScene}
          lastSuccessfulScene={lastSuccessful}
          errorReason={errorReason}
          onReshoot={onReshoot}
          onContinueWithout={onContinueWithout}
        />
      );
    case "canceled":
      // CenterStage isn't shown after cancel — CreateClient swaps back to
      // input phase. Render nothing as a defensive fallback.
      return null;
    default:
      return null;
  }
}

export default CenterStage;
