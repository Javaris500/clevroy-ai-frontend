// Deterministic fixture timeline for Roy's six-phase narrative arc
// (docs/Clevroy_Chat_Surface.md §3). Used by the layered build to drive the
// chat surface end-to-end without a backend or LLM. Layer 4/5 will swap the
// caller of this builder for a Realtime subscription that emits the same
// shape of events.
//
// All narration content comes from the single source of truth in
// `src/lib/copy.ts` `phaseNarration`. New strings introduced here would
// drift from the locked Brand Guide voice — don't.

import type { AssetKind, CharacterRef, ThreadMessageMetadata } from "@/stores/chat-store";
import { phaseNarration } from "@/lib/copy";

// ---------------------------------------------------------------------------
// Speed knob. The full pipeline is ~9 minutes end-to-end. For fixture
// playback we compress the whole arc into ~30 seconds so a developer can
// watch every phase land without waiting. All `atMs` offsets below are
// scaled against this constant.
// ---------------------------------------------------------------------------

export const PHASE_WALKER_SPEED_MS = 30_000;

// ---------------------------------------------------------------------------
// Event shape — what the walker hands to the consumer to convert into
// addMessage() calls. Layer 3 owns the rendering side; this file only
// builds the timeline.
// ---------------------------------------------------------------------------

export type PhaseEvent =
  | { type: "narration"; content: string }
  | { type: "asset"; assetKind: AssetKind; metadata: ThreadMessageMetadata }
  | { type: "activity"; content: string }
  | { type: "system"; content: string };

export type PhaseScriptEntry = { atMs: number; event: PhaseEvent };
export type PhaseScript = ReadonlyArray<PhaseScriptEntry>;

// ---------------------------------------------------------------------------
// Fixture asset URLs. Picsum.photos for stills (16:9 + 2:3); the W3C public
// sample MP4 for scene_playback. These are placeholders — when Layer 5
// connects, the backend mints real signed URLs and this file goes away.
// ---------------------------------------------------------------------------

const SCENE_IMAGES = [
  "https://picsum.photos/seed/clevroy-scene-1/1280/720",
  "https://picsum.photos/seed/clevroy-scene-2/1280/720",
  "https://picsum.photos/seed/clevroy-scene-3/1280/720",
] as const;

const SCENE_PLAYBACK_VIDEO =
  "https://www.w3schools.com/html/mov_bbb.mp4";

const SCENE_PLAYBACK_POSTER =
  "https://picsum.photos/seed/clevroy-playback/1280/720";

const ASSEMBLY_PREVIEW = "https://picsum.photos/seed/clevroy-assembly/1280/720";

const FINAL_FILM_POSTER = "https://picsum.photos/seed/clevroy-final/600/900";

const CHARACTERS: ReadonlyArray<CharacterRef> = [
  {
    id: "char-1",
    name: "Maya",
    portraitUrl: "https://picsum.photos/seed/clevroy-char-1/240/240",
  },
  {
    id: "char-2",
    name: "Detective Reyes",
    portraitUrl: "https://picsum.photos/seed/clevroy-char-2/240/240",
  },
  {
    id: "char-3",
    name: "The Stranger",
    portraitUrl: "https://picsum.photos/seed/clevroy-char-3/240/240",
  },
];

// ---------------------------------------------------------------------------
// Templated activity beats. Anti-empty-stage rule per spec §3 — pulled from
// a small pool so the same line never repeats back-to-back. These are voice-
// safe Inter `text-sm text-muted-foreground` log entries.
// ---------------------------------------------------------------------------

const ACTIVITY_LIGHTING = (n: number) => `Lighting scene ${n}.`;
const ACTIVITY_COMPOSING = (n: number) => `Composing scene ${n}.`;
const ACTIVITY_GRADING = (n: number) => `Color grading scene ${n}.`;
const ACTIVITY_VOICE_FOR = (name: string) => `Voice synthesized for ${name}.`;

// ---------------------------------------------------------------------------
// Builder. Returns a sorted timeline. The `scriptText` argument is taken so
// future variants can specialize narration on length/genre — today it is
// preserved for the contract but unused.
// ---------------------------------------------------------------------------

export function buildPhaseScript(scriptText: string): PhaseScript {
  // Mark unused-but-contractual to silence noUnusedParameters under
  // tsconfig strict mode. The argument is real — Layer 3 may consume it.
  void scriptText;

  // Phase milestones in the compressed timeline. Each anchor is the moment
  // its narration lands; assets follow inside the phase window.
  const T = PHASE_WALKER_SPEED_MS;
  const PHASE = {
    reading: Math.round(T * 0.0),       //   0% — Reading
    casting: Math.round(T * 0.1),       //  10% — Casting
    castingAssets: Math.round(T * 0.18),
    directing: Math.round(T * 0.28),    //  28% — Directing
    sceneOne: Math.round(T * 0.36),
    sceneTwo: Math.round(T * 0.46),
    sceneThree: Math.round(T * 0.56),
    voices: Math.round(T * 0.62),       //  62% — Recording voices
    score: Math.round(T * 0.7),         //  70% — Scoring
    playbackOne: Math.round(T * 0.74),
    playbackTwo: Math.round(T * 0.82),
    cutting: Math.round(T * 0.86),      //  86% — Cutting
    assembly: Math.round(T * 0.9),
    ready: Math.round(T * 0.96),        //  96% — Ready
    finalFilm: Math.round(T * 0.98),
  } as const;

  const events: Array<PhaseScriptEntry> = [];

  // Phase 1 — Reading
  events.push({
    atMs: PHASE.reading,
    event: { type: "narration", content: phaseNarration.parsing.headline },
  });

  // Phase 2 — Casting
  events.push({
    atMs: PHASE.casting,
    event: { type: "narration", content: phaseNarration.cie_building.headline },
  });
  events.push({
    atMs: PHASE.casting + Math.round(T * 0.04),
    event: { type: "activity", content: "Sketching faces." },
  });
  events.push({
    atMs: PHASE.castingAssets,
    event: {
      type: "asset",
      assetKind: "character_refs",
      metadata: { assetKind: "character_refs", characters: CHARACTERS },
    },
  });

  // Phase 3 — Directing
  events.push({
    atMs: PHASE.directing,
    event: { type: "narration", content: phaseNarration.scene_images_pending.headline },
  });
  events.push({
    atMs: PHASE.directing + Math.round(T * 0.03),
    event: { type: "activity", content: ACTIVITY_LIGHTING(1) },
  });
  events.push({
    atMs: PHASE.sceneOne,
    event: {
      type: "asset",
      assetKind: "scene_image",
      metadata: {
        assetKind: "scene_image",
        sceneId: "scene-1",
        sceneNumber: 1,
        imageUrl: SCENE_IMAGES[0],
      },
    },
  });
  events.push({
    atMs: PHASE.sceneOne + Math.round(T * 0.04),
    event: { type: "activity", content: ACTIVITY_COMPOSING(2) },
  });
  events.push({
    atMs: PHASE.sceneTwo,
    event: {
      type: "asset",
      assetKind: "scene_image",
      metadata: {
        assetKind: "scene_image",
        sceneId: "scene-2",
        sceneNumber: 2,
        imageUrl: SCENE_IMAGES[1],
      },
    },
  });
  events.push({
    atMs: PHASE.sceneTwo + Math.round(T * 0.04),
    event: { type: "activity", content: ACTIVITY_GRADING(2) },
  });
  events.push({
    atMs: PHASE.sceneThree,
    event: {
      type: "asset",
      assetKind: "scene_image",
      metadata: {
        assetKind: "scene_image",
        sceneId: "scene-3",
        sceneNumber: 3,
        imageUrl: SCENE_IMAGES[2],
      },
    },
  });

  // Phase 4 — Scoring (voices + music + scene_playback)
  events.push({
    atMs: PHASE.voices,
    event: { type: "narration", content: phaseNarration.voice_synthesis.headline },
  });
  events.push({
    atMs: PHASE.voices + Math.round(T * 0.02),
    event: { type: "activity", content: ACTIVITY_VOICE_FOR(CHARACTERS[0]!.name) },
  });
  events.push({
    atMs: PHASE.score,
    event: { type: "narration", content: phaseNarration.music_composition.headline },
  });
  events.push({
    atMs: PHASE.playbackOne,
    event: {
      type: "asset",
      assetKind: "scene_playback",
      metadata: {
        assetKind: "scene_playback",
        sceneId: "scene-1",
        sceneNumber: 1,
        playbackUrl: SCENE_PLAYBACK_VIDEO,
        posterUrl: SCENE_PLAYBACK_POSTER,
      },
    },
  });
  events.push({
    atMs: PHASE.playbackTwo,
    event: {
      type: "asset",
      assetKind: "scene_playback",
      metadata: {
        assetKind: "scene_playback",
        sceneId: "scene-2",
        sceneNumber: 2,
        playbackUrl: SCENE_PLAYBACK_VIDEO,
        posterUrl: SCENE_PLAYBACK_POSTER,
      },
    },
  });

  // Phase 5 — Cutting
  events.push({
    atMs: PHASE.cutting,
    event: { type: "narration", content: phaseNarration.final_concat.headline },
  });
  events.push({
    atMs: PHASE.assembly,
    event: {
      type: "asset",
      assetKind: "assembly_preview",
      metadata: { assetKind: "assembly_preview", imageUrl: ASSEMBLY_PREVIEW },
    },
  });

  // Phase 6 — Ready
  events.push({
    atMs: PHASE.ready,
    event: { type: "narration", content: phaseNarration.complete.headline },
  });
  events.push({
    atMs: PHASE.finalFilm,
    event: {
      type: "asset",
      assetKind: "final_film",
      metadata: {
        assetKind: "final_film",
        posterUrl: FINAL_FILM_POSTER,
        imageUrl: FINAL_FILM_POSTER,
      },
    },
  });

  // Sort defensively. Each phase block is hand-ordered, but adjacent
  // phases can interleave when atMs offsets get tuned.
  events.sort((a, b) => a.atMs - b.atMs);

  return events;
}

// ---------------------------------------------------------------------------
// TODO(tests): when a runner is wired (vitest/jest), add a smoke test:
//   - buildPhaseScript("anything").length is between 14 and 18.
//   - Every entry's atMs is monotonically non-decreasing after the sort.
//   - Six narration events; one each per phase headline.
//   - Exactly 1 character_refs, 3 scene_image, 2 scene_playback, 1
//     assembly_preview, 1 final_film asset event.
//   - All asset events carry `metadata.assetKind` set to the asset's kind.
//   - No event references narration content not present in
//     `phaseNarration` from src/lib/copy.ts.
// ---------------------------------------------------------------------------
