"use client";

// Single hook the generation phase reads from. In hardcoded mode (default
// during local dev) it walks the 12-state enum on a timer so the visual flow
// can be exercised without a backend. When `NEXT_PUBLIC_USE_HARDCODED=false`
// it forwards to Stratum's `useFilmRealtime` (which today throws — that's
// expected; the hook lights up when Stratum's S7 implementation lands).
//
// The shape returned matches a superset of `UseFilmRealtimeResult` plus the
// Scenes / Characters / DialogueLines slices that <CenterStage /> needs to
// render each phase. When the real hook lands we'll source those slices from
// `useFilm()` instead and delete the fixture branch entirely.

import { useEffect, useMemo, useReducer, useRef } from "react";

import { useHardcodedFixtures } from "@/hooks/_fixtures";
import type { RealtimeStatus } from "@/hooks/use-film-realtime";
// `useFilmRealtime` throws today (S0 stub). When Stratum's S7 lands we'll
// import it here and route the non-fixture branch through it.
// import { useFilmRealtime } from "@/hooks/use-film-realtime";
import type {
  Character,
  DialogueLine,
  FilmStateSnapshot,
  Scene,
} from "@/types/api";
import type { FilmState } from "@/types/film-state";
import type { ActivityFeedEntry } from "@/components/activity-feed";

import {
  FIXTURE_FILM_ID,
  fixtureCharacters,
  fixtureDialogueLines,
  fixtureScenes,
  fixtureScript,
  fixtureSnapshot,
} from "./generation-fixtures";

export type GenerationStream = {
  status: RealtimeStatus;
  snapshot: FilmStateSnapshot | null;
  events: ActivityFeedEntry[];
  scenes: Scene[];
  characters: Character[];
  dialogueLines: DialogueLine[];
  /** Currently spotlighted scene id (used by CenterStage + SceneStrip). */
  activeSceneId: string | null;
  /** The currently-spoken line during voice_synthesis, or null. */
  activeDialogueLine: DialogueLine | null;
  /** Script text — populated immediately by the create-page submission so
   *  the parsing phase can stream it line-by-line. */
  scriptText: string;
  /** Aspect ratio chosen at submit time. CenterStage uses it to set the
   *  panel ratio once parsing completes (Design_System §8.1). */
  aspectRatio: string;
  /** Style preset label the user picked, or null. Used by music_composition. */
  styleLabel: string | null;
};

// --------------------------------------------------------------------------
// Real-mode adapter (placeholder).
// When Stratum's S7 `useFilmRealtime` implementation lands AND her `useFilm`
// hook is wired, the real branch reconstructs `GenerationStream` like this:
//
//   const realtime = useFilmRealtime(filmId);
//   const film = useFilm(filmId);
//   return {
//     status: realtime.status,
//     snapshot: realtime.snapshot,
//     events: realtime.events,
//     scenes: film.data?.scenes ?? [],
//     characters: film.data?.characters ?? [],
//     ...
//   };
//
// For now we never hit this branch — `useGenerationStream` always returns
// the simulated stream because the throwing stub would crash render.
// --------------------------------------------------------------------------

function useRealStreamPlaceholder(_filmId: string | undefined): GenerationStream {
  return {
    status: "idle",
    snapshot: null,
    events: [],
    scenes: [],
    characters: [],
    dialogueLines: [],
    activeSceneId: null,
    activeDialogueLine: null,
    scriptText: "",
    aspectRatio: "16:9",
    styleLabel: null,
  };
}

// --------------------------------------------------------------------------
// Hardcoded simulator — walks the 12-state enum on a timer.
// --------------------------------------------------------------------------

const PHASE_DURATIONS_MS: Record<FilmState, number> = {
  pending: 1200,
  parsing: 4500,
  cie_building: 1800,
  character_refs: 4200,
  scene_images_pending: 4000, // per scene; multiplied at run time
  voice_synthesis: 4500,
  music_composition: 5500,
  scene_assembly: 4500, // per scene; multiplied at run time
  final_concat: 4000,
  complete: Number.POSITIVE_INFINITY,
  error: Number.POSITIVE_INFINITY,
  canceled: Number.POSITIVE_INFINITY,
};

const PHASE_ORDER: FilmState[] = [
  "pending",
  "parsing",
  "cie_building",
  "character_refs",
  "scene_images_pending",
  "voice_synthesis",
  "music_composition",
  "scene_assembly",
  "final_concat",
  "complete",
];

type SimState = {
  phase: FilmState;
  /** Index into the active scene list (0-based). Used during scene-driven
   *  phases (scene_images_pending, scene_assembly). */
  sceneIndex: number;
  scenes: Scene[];
  characters: Character[];
  events: ActivityFeedEntry[];
  startedAt: number;
};

type SimAction =
  | { type: "advance"; nextPhase: FilmState; at: number }
  | { type: "advanceScene"; at: number }
  | { type: "log"; entry: ActivityFeedEntry };

function makeId(): string {
  // Stable enough for fixture rows. Real entries use UUIDs from the backend.
  return `evt-${Math.random().toString(36).slice(2, 10)}`;
}

function reducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "advance": {
      const nextScenes = state.scenes;
      const nextChars = state.characters;
      const nextEvents = state.events.concat(
        phaseEnterEvent(action.nextPhase, action.at, nextScenes.length),
      );
      // Mutate scene/character state to mirror the phase transition.
      const advancedScenes = applyPhaseSceneState(nextScenes, action.nextPhase);
      const advancedCharacters = applyPhaseCharacterState(
        nextChars,
        action.nextPhase,
      );
      return {
        ...state,
        phase: action.nextPhase,
        sceneIndex: 0,
        scenes: advancedScenes,
        characters: advancedCharacters,
        events: nextEvents,
        startedAt: action.at,
      };
    }
    case "advanceScene": {
      const nextIndex = state.sceneIndex + 1;
      const updatedScenes = state.scenes.map((scene, i) => {
        if (state.phase === "scene_images_pending") {
          if (i < nextIndex) {
            return { ...scene, state: "image_ready" as const, image_url: null };
          }
          return scene;
        }
        if (state.phase === "scene_assembly") {
          if (i < nextIndex) {
            return { ...scene, state: "assembled" as const };
          }
          return scene;
        }
        return scene;
      });
      const newEntry: ActivityFeedEntry = {
        id: makeId(),
        timestamp: action.at,
        kind: "complete",
        message:
          state.phase === "scene_assembly"
            ? `Scene ${state.sceneIndex + 1} cut.`
            : `Scene ${state.sceneIndex + 1} image ready.`,
      };
      return {
        ...state,
        sceneIndex: nextIndex,
        scenes: updatedScenes,
        events: state.events.concat(newEntry),
      };
    }
    case "log": {
      return { ...state, events: state.events.concat(action.entry) };
    }
  }
}

function phaseEnterEvent(
  phase: FilmState,
  at: number,
  totalScenes: number,
): ActivityFeedEntry {
  const messages: Partial<Record<FilmState, string>> = {
    parsing: "Parsing your script.",
    cie_building: "Synthesizing character identities.",
    character_refs: "Casting reference portraits.",
    scene_images_pending: `Rendering ${totalScenes} scenes.`,
    voice_synthesis: "Recording dialogue lines.",
    music_composition: "Composing the score.",
    scene_assembly: "Cutting scenes together.",
    final_concat: "Stitching the final cut.",
    complete: "Final cut ready.",
  };
  return {
    id: makeId(),
    timestamp: at,
    kind: phase === "complete" ? "complete" : "active",
    message: messages[phase] ?? `Entered ${phase}.`,
  };
}

function applyPhaseSceneState(scenes: Scene[], phase: FilmState): Scene[] {
  // No batch mutation needed at phase enter — scene state advances per-scene.
  // Reset all to pending if we're entering scene_images_pending fresh, etc.
  if (phase === "scene_images_pending") {
    return scenes.map((s) => ({ ...s, state: "pending" as const }));
  }
  return scenes;
}

function applyPhaseCharacterState(
  chars: Character[],
  phase: FilmState,
): Character[] {
  if (phase === "character_refs") {
    return chars.map((c, i) => ({
      ...c,
      state: i === 0 ? ("ref_ready" as const) : ("pending" as const),
    }));
  }
  if (phase === "voice_synthesis" || phase === "music_composition") {
    return chars.map((c) => ({ ...c, state: "ref_ready" as const }));
  }
  return chars;
}

function useSimulatedStream(scriptText: string, styleLabel: string | null): GenerationStream {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const now = Date.now();
    return {
      phase: "pending" as FilmState,
      sceneIndex: 0,
      scenes: fixtureScenes.map((s) => ({ ...s })),
      characters: fixtureCharacters.map((c) => ({ ...c })),
      events: [
        {
          id: makeId(),
          timestamp: now,
          kind: "active" as const,
          message: "Starting your film.",
        },
      ],
      startedAt: now,
    };
  });

  // Phase advancement timer.
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Per-scene sub-step timer (for scene_images_pending and scene_assembly).
  const sceneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any stale timers on phase change.
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);

    const phase = state.phase;
    if (phase === "complete" || phase === "error" || phase === "canceled") {
      return;
    }

    const isSceneDriven =
      phase === "scene_images_pending" || phase === "scene_assembly";
    const totalScenes = state.scenes.length;
    const completedScenes = state.sceneIndex;

    if (isSceneDriven && completedScenes < totalScenes) {
      sceneTimerRef.current = setTimeout(() => {
        dispatch({ type: "advanceScene", at: Date.now() });
      }, PHASE_DURATIONS_MS[phase]);
      return () => {
        if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
      };
    }

    // Phase done — advance to the next.
    const idx = PHASE_ORDER.indexOf(phase);
    const nextPhase = PHASE_ORDER[idx + 1];
    if (!nextPhase) return;
    const dwell = isSceneDriven ? 600 : PHASE_DURATIONS_MS[phase];
    phaseTimerRef.current = setTimeout(() => {
      dispatch({ type: "advance", nextPhase, at: Date.now() });
    }, dwell);

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [state.phase, state.sceneIndex, state.scenes.length]);

  // Stagger character ref portraits during character_refs.
  useEffect(() => {
    if (state.phase !== "character_refs") return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    state.characters.forEach((char, i) => {
      if (char.state === "ref_ready") return;
      const t = setTimeout(() => {
        dispatch({
          type: "log",
          entry: {
            id: makeId(),
            timestamp: Date.now(),
            kind: "complete",
            message: `Portrait of ${char.name} cast.`,
          },
        });
      }, (i + 1) * 700);
      timeouts.push(t);
    });
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [state.phase, state.characters]);

  const snapshot: FilmStateSnapshot = useMemo(() => {
    const scenesReady = state.scenes.filter(
      (s) => s.state !== "pending",
    ).length;
    const detail: Record<string, unknown> = {};
    if (state.phase === "scene_images_pending") {
      detail.current_scene = state.sceneIndex + 1;
      detail.total_scenes = state.scenes.length;
    }
    if (state.phase === "music_composition" && styleLabel) {
      detail.music_style = styleLabel;
    }
    return {
      state: state.phase,
      current_phase_detail: detail,
      scene_count: state.scenes.length,
      scenes_ready: scenesReady,
      last_event_at: new Date(state.startedAt).toISOString(),
    };
  }, [state.phase, state.sceneIndex, state.scenes, state.startedAt, styleLabel]);

  const activeSceneId = (() => {
    if (state.phase === "scene_images_pending" || state.phase === "scene_assembly") {
      return state.scenes[state.sceneIndex]?.id ?? null;
    }
    if (state.phase === "voice_synthesis") {
      return state.scenes[0]?.id ?? null;
    }
    if (state.phase === "final_concat" || state.phase === "complete") {
      return state.scenes[state.scenes.length - 1]?.id ?? null;
    }
    return null;
  })();

  const activeDialogueLine =
    state.phase === "voice_synthesis" ? fixtureDialogueLines[0] : null;

  return {
    status: "connected",
    snapshot,
    events: state.events,
    scenes: state.scenes,
    characters: state.characters,
    dialogueLines: fixtureDialogueLines,
    activeSceneId,
    activeDialogueLine,
    scriptText: scriptText || fixtureScript,
    aspectRatio: "16:9",
    styleLabel,
  };
}

// --------------------------------------------------------------------------
// Public hook — branches on the hardcoded flag.
// --------------------------------------------------------------------------

export interface UseGenerationStreamArgs {
  filmId: string | undefined;
  scriptText: string;
  styleLabel: string | null;
}

export function useGenerationStream({
  filmId,
  scriptText,
  styleLabel,
}: UseGenerationStreamArgs): GenerationStream {
  const hardcoded = useHardcodedFixtures();

  // Both hooks are called every render to honor rules-of-hooks; we just pick
  // which result to surface. The simulator is always safe to call. The real
  // adapter is a placeholder until Stratum's S7 lands — see comment above.
  const sim = useSimulatedStream(scriptText, styleLabel);
  const real = useRealStreamPlaceholder(filmId);

  // Until Stratum's hooks light up, treat fixture mode as the only working
  // mode regardless of the flag (the real path returns idle with no data).
  const wantReal = !hardcoded && filmId !== undefined && filmId !== FIXTURE_FILM_ID;
  return wantReal && real.snapshot !== null ? real : sim;
}
