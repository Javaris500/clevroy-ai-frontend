// Backend response shapes for the films API. Mirrors Backend_Handoff.md §8.3.
// Kept out of src/types/film-state.ts (Leia's file) so the two ownerships stay
// clean: Leia owns the state machine identity, Stratum will own the API client
// and may relocate this file under @/types or @clevroy/types once the shared
// package lands. Until then this file is the contract Stratum implements
// against and Leon / Kaiser / Nemi consume.
//
// TODO: migrate to @clevroy/types when the shared package is published.

import type { FilmState } from "@/types/film-state";
import { TERMINAL_STATES } from "@/types/film-state";

// GET /api/films — list view used by Home (Recent films) and Projects.
// `cover_image_url` is the resolved signed URL the backend attaches alongside
// the raw R2 key; consumers should never sign URLs themselves.
export interface FilmSummary {
  id: string;
  title: string;
  state: FilmState;
  /** ISO 8601 string. Never cast to Date for sort math; let the backend sort. */
  created_at: string;
  /** ISO 8601 string. Null while in-progress, errored, or canceled. */
  completed_at: string | null;
  scene_count: number;
  duration_seconds: number | null;
  cover_image_url: string | null;
  /** True when the film completed with at least one scene marked failed. */
  is_incomplete?: boolean;
  /** ISO 8601. Null = unseen since last completion. Drives the "New" badge. */
  viewed_at?: string | null;
}

// GET /api/films/{film_id} — full record for the Results page and the
// not-found / restore variants. Soft-delete fields drive EC-N8's restore card.
export interface Film extends FilmSummary {
  script_text: string;
  style_preset: string;
  aspect_ratio: string;
  state_error_reason: string | null;
  /** ISO 8601 of soft-delete; null when the film is live. */
  deleted_at: string | null;
  /** ISO 8601 of permanent purge (deleted_at + 30 days). */
  permanent_delete_at: string | null;
}

// Cursor-paginated list response. `next_cursor === null` means no more pages.
// Stratum's useInfiniteFilms keys pages by `next_cursor` (passes it back as
// the `cursor` query param on the next page request).
export interface FilmsListResponse {
  films: FilmSummary[];
  next_cursor: string | null;
}

export type FilmsSort = "created_desc" | "created_asc" | "title_asc";

/** /projects status-filter buckets. Layout_Enhancements A.7 — four chips that
 *  collapse the 12-state backend enum into the four states the user thinks in.
 *  `canceled` films currently roll up under `error` so the strip stays at four
 *  chips. Revisit if the design adds a separate "Canceled" pill. */
export type FilmsStatusFilter = "all" | "in_progress" | "complete" | "error";

/** True when the film is mid-pipeline. Drives EC-N9's delete-blocking and the
 * "Film in progress" card on Home. */
export function isFilmInProgress(state: FilmState): boolean {
  return !TERMINAL_STATES.has(state);
}

/** Returns true when `state` belongs to the `filter` bucket. The "all" bucket
 *  always matches. Keeps the toggle wiring trivial in the consumer. */
export function matchesStatusFilter(
  state: FilmState,
  filter: FilmsStatusFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "in_progress":
      return isFilmInProgress(state);
    case "complete":
      return state === "complete";
    case "error":
      return state === "error" || state === "canceled";
  }
}
