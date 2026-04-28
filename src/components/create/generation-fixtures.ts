// Hardcoded fixtures for the generation phase. INLINE in this stream per the
// hardcoded-fixtures rule (no msw, no shared mock package). Shapes match
// Stratum's @/types/api so the swap to NEXT_PUBLIC_USE_HARDCODED=false is a
// no-op for the consuming components.

import type {
  Character,
  DialogueLine,
  FilmStateSnapshot,
  Scene,
} from "@/types/api";
import type { ActivityFeedEntry } from "@/components/activity-feed";

export const FIXTURE_FILM_ID = "fixture-001";

/** A 5-scene demo film. Scene state is mutated by the simulator over time. */
export const fixtureScenes: Scene[] = [
  {
    id: "scene-1",
    film_id: FIXTURE_FILM_ID,
    scene_number: 1,
    description: "INT. ALL-NIGHT DINER — 3 AM. Maya stares at her coffee.",
    location: "INT. DINER",
    time_of_day: "night",
    state: "pending",
    image_url: null,
    clip_url: null,
    duration_seconds: null,
    failure_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "scene-2",
    film_id: FIXTURE_FILM_ID,
    scene_number: 2,
    description: "Daniel slides into the booth across from Maya.",
    location: "INT. DINER",
    time_of_day: "night",
    state: "pending",
    image_url: null,
    clip_url: null,
    duration_seconds: null,
    failure_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "scene-3",
    film_id: FIXTURE_FILM_ID,
    scene_number: 3,
    description: "EXT. PARKING LOT — neon sign flickers behind them.",
    location: "EXT. PARKING LOT",
    time_of_day: "night",
    state: "pending",
    image_url: null,
    clip_url: null,
    duration_seconds: null,
    failure_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "scene-4",
    film_id: FIXTURE_FILM_ID,
    scene_number: 4,
    description: "INT. MAYA'S CAR — she drives east into the dawn.",
    location: "INT. CAR",
    time_of_day: "dawn",
    state: "pending",
    image_url: null,
    clip_url: null,
    duration_seconds: null,
    failure_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "scene-5",
    film_id: FIXTURE_FILM_ID,
    scene_number: 5,
    description: "EXT. OVERLOOK — Maya stops the car and steps out.",
    location: "EXT. OVERLOOK",
    time_of_day: "dawn",
    state: "pending",
    image_url: null,
    clip_url: null,
    duration_seconds: null,
    failure_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const fixtureCharacters: Character[] = [
  {
    id: "char-maya",
    film_id: FIXTURE_FILM_ID,
    name: "MAYA",
    description: "early 30s, dark hair, tired eyes",
    cie_description: null,
    reference_image_url: null,
    voice_id: null,
    voice_gender: "female",
    state: "pending",
    failure_reason: null,
  },
  {
    id: "char-daniel",
    film_id: FIXTURE_FILM_ID,
    name: "DANIEL",
    description: "mid 30s, leather jacket, calm",
    cie_description: null,
    reference_image_url: null,
    voice_id: null,
    voice_gender: "male",
    state: "pending",
    failure_reason: null,
  },
  {
    id: "char-bartender",
    film_id: FIXTURE_FILM_ID,
    name: "BARTENDER",
    description: "60s, wears a flannel, sees everything",
    cie_description: null,
    reference_image_url: null,
    voice_id: null,
    voice_gender: "neutral",
    state: "pending",
    failure_reason: null,
  },
];

export const fixtureDialogueLines: DialogueLine[] = [
  {
    id: "line-1",
    scene_id: "scene-1",
    character_id: "char-maya",
    line_number: 1,
    text: "I almost didn't come.",
    audio_url: null,
    duration_seconds: null,
    state: "pending",
  },
  {
    id: "line-2",
    scene_id: "scene-2",
    character_id: "char-daniel",
    line_number: 1,
    text: "I'm glad you did.",
    audio_url: null,
    duration_seconds: null,
    state: "pending",
  },
];

export const fixtureSnapshot: FilmStateSnapshot = {
  state: "pending",
  current_phase_detail: {},
  scene_count: fixtureScenes.length,
  scenes_ready: 0,
  last_event_at: new Date().toISOString(),
};

export const fixtureScript = `INT. ALL-NIGHT DINER — 3 AM

The diner is empty. MAYA sits in a booth with a black coffee and a notebook full of crossed-out sentences. The neon sign outside reads OPEN in cinematic red, even though most of the booths haven't been used in years.

DANIEL pushes through the door, scanning the room. He spots her. He hesitates. Then he walks over.

DANIEL
I'm glad you came.

MAYA
I almost didn't.

The BARTENDER pours water without being asked. He's seen a thousand of these conversations.

EXT. PARKING LOT — CONTINUOUS

They stand under a flickering sign. Daniel's hands are in his pockets. Maya's eyes are on the horizon.

INT. MAYA'S CAR — DAWN

She drives east. The sky cracks open over the highway.

EXT. OVERLOOK — DAWN

Maya stops the car and steps out. She doesn't look back.`;

/** Activity feed entry shape Nemi exports — kept inline so it's clear this
 *  is fixture data, not a runtime contract. */
export type FixtureActivityEntry = ActivityFeedEntry;
