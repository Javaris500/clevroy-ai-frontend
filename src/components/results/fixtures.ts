// Hand-rolled inline fixture data for Kaiser's Results page surfaces.
// Per Axios's 2026-04-24 directive: each agent owns their own demo data —
// no shared mocks, no msw. Branched on NEXT_PUBLIC_USE_HARDCODED at the call
// site via `useHardcodedFixtures()`.
//
// Every shape here is typed against Stratum's contract (`src/types/api.ts`)
// and Leon's `Film`. When Stratum's S6 implementations land, the same
// hooks will return real data and these fixtures fall out of the build.
//
// Two films are exported:
//   - KAISER_FIXTURE_FILM_COMPLETE — happy path, state="complete", 5 scenes
//   - KAISER_FIXTURE_FILM_ERROR — EC-G4 case, state="error", scene 4 failed

import type { Character, DialogueLine, Scene } from "@/types/api";

import type {
  ApiCallSummary,
  CostBreakdown,
  FilmDetails,
} from "./types";

const FIXTURE_FILM_ID = "fixture-film-001";
const FIXTURE_FILM_ID_ERROR = "fixture-film-002";

const characters: Character[] = [
  {
    id: "ch-1",
    film_id: FIXTURE_FILM_ID,
    name: "Maya",
    description: "early 30s, dark hair, tired eyes",
    cie_description:
      "Woman, early thirties, shoulder-length dark hair pulled into a low ponytail, charcoal wool coat, faint shadows under hazel eyes.",
    reference_image_url: null,
    voice_id: "elv-female-warm-1",
    voice_gender: "female",
    state: "ref_ready",
    failure_reason: null,
  },
  {
    id: "ch-2",
    film_id: FIXTURE_FILM_ID,
    name: "Sam",
    description: "late 30s, weathered, soft-spoken",
    cie_description:
      "Man, late thirties, salt-and-pepper stubble, faded olive jacket, calm steady gaze.",
    reference_image_url: null,
    voice_id: "elv-male-low-2",
    voice_gender: "male",
    state: "ref_ready",
    failure_reason: null,
  },
];

const scenes: Scene[] = [
  {
    id: "sc-1",
    film_id: FIXTURE_FILM_ID,
    scene_number: 1,
    description: "Maya walks into the diner. Rain on the windows.",
    location: "INT. DINER — NIGHT",
    time_of_day: "night",
    state: "assembled",
    image_url: null,
    clip_url: null,
    duration_seconds: 12,
    failure_reason: null,
    created_at: "2026-04-24T14:00:00Z",
    updated_at: "2026-04-24T14:01:30Z",
  },
  {
    id: "sc-2",
    film_id: FIXTURE_FILM_ID,
    scene_number: 2,
    description: "Sam looks up from a coffee. Recognition.",
    location: "INT. DINER — NIGHT",
    time_of_day: "night",
    state: "assembled",
    image_url: null,
    clip_url: null,
    duration_seconds: 9,
    failure_reason: null,
    created_at: "2026-04-24T14:00:00Z",
    updated_at: "2026-04-24T14:01:45Z",
  },
  {
    id: "sc-3",
    film_id: FIXTURE_FILM_ID,
    scene_number: 3,
    description: "She sits across from him without speaking.",
    location: "INT. DINER — NIGHT",
    time_of_day: "night",
    state: "assembled",
    image_url: null,
    clip_url: null,
    duration_seconds: 11,
    failure_reason: null,
    created_at: "2026-04-24T14:00:00Z",
    updated_at: "2026-04-24T14:02:00Z",
  },
  {
    id: "sc-4",
    film_id: FIXTURE_FILM_ID,
    scene_number: 4,
    description: "Sam pushes a folded letter across the table.",
    location: "INT. DINER — NIGHT",
    time_of_day: "night",
    state: "assembled",
    image_url: null,
    clip_url: null,
    duration_seconds: 14,
    failure_reason: null,
    created_at: "2026-04-24T14:00:00Z",
    updated_at: "2026-04-24T14:02:15Z",
  },
  {
    id: "sc-5",
    film_id: FIXTURE_FILM_ID,
    scene_number: 5,
    description: "Maya reads. She closes her eyes.",
    location: "INT. DINER — NIGHT",
    time_of_day: "night",
    state: "assembled",
    image_url: null,
    clip_url: null,
    duration_seconds: 16,
    failure_reason: null,
    created_at: "2026-04-24T14:00:00Z",
    updated_at: "2026-04-24T14:02:30Z",
  },
];

const dialogueLines: DialogueLine[] = [
  {
    id: "dl-1",
    scene_id: "sc-1",
    character_id: "ch-1",
    line_number: 1,
    text: "I almost didn't come.",
    audio_url: null,
    duration_seconds: 2.4,
    state: "synthesized",
  },
  {
    id: "dl-2",
    scene_id: "sc-2",
    character_id: "ch-2",
    line_number: 1,
    text: "I'm glad you did.",
    audio_url: null,
    duration_seconds: 1.9,
    state: "synthesized",
  },
  {
    id: "dl-3",
    scene_id: "sc-3",
    character_id: "ch-1",
    line_number: 1,
    text: "Three years. I should be angrier.",
    audio_url: null,
    duration_seconds: 2.7,
    state: "synthesized",
  },
];

const apiCalls: ApiCallSummary[] = [
  {
    occurred_at: "2026-04-24T14:00:02Z",
    provider: "Gemini",
    model: "gemini-2.5-flash",
    latency_ms: 1820,
    cost_usd: "0.02",
    status: "success",
  },
  {
    occurred_at: "2026-04-24T14:00:18Z",
    provider: "fal.ai",
    model: "flux-kontext-pro",
    latency_ms: 5410,
    cost_usd: "0.06",
    status: "success",
  },
  {
    occurred_at: "2026-04-24T14:00:32Z",
    provider: "fal.ai",
    model: "nano-banana-2",
    latency_ms: 7220,
    cost_usd: "0.09",
    status: "success",
  },
  {
    occurred_at: "2026-04-24T14:01:05Z",
    provider: "ElevenLabs",
    model: "eleven-multilingual-v2",
    latency_ms: 1240,
    cost_usd: "0.01",
    status: "success",
  },
  {
    occurred_at: "2026-04-24T14:01:22Z",
    provider: "ElevenLabs",
    model: "eleven-music-v1",
    latency_ms: 8030,
    cost_usd: "0.04",
    status: "success",
  },
];

const costBreakdown: CostBreakdown = {
  total_credits: "1.00",
  lines: [
    { label: "Script reading", amount_credits: "0.05" },
    { label: "Character casting", amount_credits: "0.10" },
    { label: "Scene shots", amount_credits: "0.50" },
    { label: "Voice & score", amount_credits: "0.30" },
    { label: "Final cut", amount_credits: "0.05" },
  ],
};

export const KAISER_FIXTURE_FILM_COMPLETE: FilmDetails = {
  // FilmSummary fields
  id: FIXTURE_FILM_ID,
  title: "The Last Reel",
  state: "complete",
  created_at: "2026-04-24T14:00:00Z",
  completed_at: "2026-04-24T14:03:00Z",
  scene_count: 5,
  duration_seconds: 62,
  cover_image_url: null,
  is_incomplete: false,
  viewed_at: null,
  // Film fields
  script_text:
    "INT. DINER — NIGHT\n\nMaya walks in from the rain. Sam looks up.\n\nMAYA\nI almost didn't come.\n\nSAM\nI'm glad you did.\n\nMaya sits. Sam pushes a folded letter across the table. Maya reads. She closes her eyes.",
  style_preset: "Cinematic",
  aspect_ratio: "16:9",
  state_error_reason: null,
  deleted_at: null,
  permanent_delete_at: null,
  // Kaiser-local nested
  scenes,
  characters,
  dialogue_lines: dialogueLines,
  api_calls: apiCalls,
  cost_breakdown: costBreakdown,
};

const errorScenes: Scene[] = scenes.map((s, idx) =>
  idx === 3
    ? {
        ...s,
        film_id: FIXTURE_FILM_ID_ERROR,
        state: "failed",
        failure_reason: "Scene image generation timed out after retries.",
        updated_at: "2026-04-24T16:02:18Z",
      }
    : { ...s, film_id: FIXTURE_FILM_ID_ERROR },
);

export const KAISER_FIXTURE_FILM_ERROR: FilmDetails = {
  ...KAISER_FIXTURE_FILM_COMPLETE,
  id: FIXTURE_FILM_ID_ERROR,
  title: "The Quiet Block",
  state: "error",
  state_error_reason: "scene_4_image_failed",
  completed_at: null,
  created_at: "2026-04-24T15:58:00Z",
  scenes: errorScenes,
};
