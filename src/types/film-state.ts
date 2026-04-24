// TODO: Migrate this enum to the shared `@clevroy/types` package once it exists.
// Source of truth is the Pydantic FilmState on the backend — see
// Clevroy_Backend_Handoff.md §6 and Clevroy_Dev_Overview.md §4.4.
// When the shared package is wired up, delete this file and re-export from there.

export const FILM_STATES = [
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
  "error",
  "canceled",
] as const;

export type FilmState = (typeof FILM_STATES)[number];

export const TERMINAL_STATES: ReadonlySet<FilmState> = new Set([
  "complete",
  "error",
  "canceled",
]);

export type SceneStatus = "empty" | "pending" | "ready" | "active" | "error";

export type ActivityKind = "active" | "complete" | "warning" | "error";
