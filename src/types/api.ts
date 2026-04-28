// Backend API contract types — every shape other agents hardcode against.
// Mirrors Clevroy_Backend_Handoff.md §8 (routes), §7 (schema). Coexists with
// Leon's src/types/film.ts: Leon owns FilmSummary / Film / FilmsListResponse /
// FilmsSort / isFilmInProgress; Stratum owns everything else (auth/profile,
// state snapshot, request/response shapes, billing, twins, error envelope).
//
// TODO: migrate to @clevroy/types when the backend's pydantic-to-typescript
// pipeline lands (Dev_Overview §5.6, Starter_Repo_Structure §6).

import type { FilmState } from "@/types/film-state";

// ---------------------------------------------------------------------------
// Money — NUMERIC(8,2) end to end. Never coerce to number for math.
// (Dev_Overview §11.3, ground rules: "NUMERIC(8,2) end-to-end".)
// ---------------------------------------------------------------------------

/**
 * A NUMERIC(8,2) credit/film amount as a string. Always two decimals.
 * Pass it back to the backend untouched. Display-only formatting (Math.floor
 * for "3 films left", or `parseFloat` for the count-up animation in EC-N7)
 * is allowed at the leaf component, but the canonical value must stay a
 * string everywhere it's stored or transmitted.
 */
export type Credits = string;

/**
 * The slice exposed by Stratum's balance store (`src/stores/balance-store.ts`,
 * S8). Sidebar, Create-page subline, and Buy-more-films button all read from
 * one source of truth (EC-N7 — never two different numbers on screen at once).
 */
export interface Balance {
  credits: Credits;
}

// ---------------------------------------------------------------------------
// User profile (mirrors `user_profiles` from Backend_Handoff §7.2)
// ---------------------------------------------------------------------------

export type ThemePreference = "light" | "dark" | "system";

export type TwinStatus = "none" | "training" | "ready" | "failed";

/** GET /api/me — full profile. */
export interface Profile {
  id: string;
  display_name: string | null;
  /** Convenience field the API derives from display_name's first token. Used
   * by Home's H1 ("Welcome back, {first_name}"). Leon's pages depend on it. */
  first_name: string;
  avatar_url: string | null;
  /** Surface-language alias of `credits_remaining`. The API renames it at the
   * boundary; the database column stays `credits_remaining` (Brand_Guide §5.3).
   * String form of NUMERIC(8,2) — never coerce. */
  films_remaining: Credits;
  theme_preference: ThemePreference;
  reduced_motion: boolean;
  voice_twin_status: TwinStatus;
  voice_twin_key: string | null;
  face_twin_status: TwinStatus;
  face_twin_key: string | null;
  /** ISO 8601. Null until the user finishes onboarding (CC-1). */
  onboarding_completed_at: string | null;
}

/** PATCH /api/me — any subset of the editable fields. */
export type UpdateProfileRequest = Partial<
  Pick<
    Profile,
    "display_name" | "avatar_url" | "theme_preference" | "reduced_motion"
  >
>;

/** POST /api/me/onboarding (the one Clevroy-owned auth-adjacent route, §8.1). */
export interface OnboardingRequest {
  theme_preference: ThemePreference;
  reduced_motion: boolean;
}

/** DELETE /api/me — body must contain the literal string "delete" matching
 * what the user typed in the confirmation field. */
export interface DeleteAccountRequest {
  confirm: "delete";
}

export interface DeleteAccountResponse {
  /** ISO 8601 — 30-day soft delete window end. */
  deletion_scheduled_for: string;
}

// ---------------------------------------------------------------------------
// Films — request/response shapes. The Film/FilmSummary/FilmsListResponse
// types live in src/types/film.ts (Leon's). Don't redefine them here.
// ---------------------------------------------------------------------------

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

/** POST /api/films — Backend_Handoff §8.3. */
export interface CreateFilmRequest {
  script_text: string;
  style_preset: string;
  aspect_ratio: AspectRatio;
  title?: string;
  use_voice_twin?: boolean;
  use_face_twin?: boolean;
}

export interface CreateFilmResponse {
  film_id: string;
  state: FilmState;
}

/** GET /api/films — query params for list/infinite. Soft-deleted films are
 * excluded by default (Backend_Handoff §8.3). */
export interface FilmsListParams {
  cursor?: string | null;
  limit?: number;
  include_deleted?: boolean;
  /** Mirrors Leon's FilmsSort. Sort + search are server-side per
   * Design_System §7.3. */
  sort?: "created_desc" | "created_asc" | "title_asc";
  search?: string;
}

/** PATCH /api/films/{id} — only `title` is editable today. */
export interface RenameFilmRequest {
  title: string;
}

/** GET /api/films/{id}/state — light reconnection-catch-up payload (§8.3,
 * EC-G1, EC-G2). Designed to be polled cheaply (<1KB). */
export interface FilmStateSnapshot {
  state: FilmState;
  /** Phase-specific extra detail. For `scene_images_pending`, includes the
   * current scene index and total. For `voice_synthesis`, may include the
   * provider name. Schema is intentionally open since phases differ. */
  current_phase_detail: Record<string, unknown>;
  scene_count: number;
  scenes_ready: number;
  /** ISO 8601 of the most recent state change. */
  last_event_at: string;
}

/** POST /api/films/{id}/cancel — frontend mints `idempotency_key` per click
 * (EC-G6, EC-G8). */
export interface CancelFilmRequest {
  idempotency_key: string;
}

export interface CancelFilmResponse {
  refund_amount: Credits;
  /** ISO 8601. */
  canceled_at: string;
}

/** DELETE /api/films/{id} — soft-delete with 30-day recovery window. */
export interface DeleteFilmResponse {
  /** ISO 8601 — when the permanent purge runs. */
  deletion_scheduled_for: string;
}

/** POST /api/films/{id}/duplicate — NOT in Backend_Handoff §8 yet. Stratum
 * defined this signature optimistically because Leon's UI exposes a
 * "Duplicate" overflow item. Backend needs to add the route or this hook
 * gets dropped. See coordination.md → Stratum 2026-04-24. */
export interface DuplicateFilmResponse {
  film_id: string;
  state: FilmState;
}

/** POST /api/films/{id}/restore — within the 30-day soft-delete window. */
// Restored film returns the full Film object (Leon's type). The hook itself
// types the response as Film; we re-export Leon's type for callers that want
// to import everything from one place.
export type { Film, FilmSummary, FilmsListResponse, FilmsSort } from "@/types/film";

// ---------------------------------------------------------------------------
// Reshoot (Backend_Handoff §8.4)
// ---------------------------------------------------------------------------

/** EC-G4: `generation_failure` reshoots are free; `user_initiated` debits
 * 0.20 credits. */
export type ReshootReason = "user_initiated" | "generation_failure";

export interface ReshootSceneRequest {
  idempotency_key: string;
  reason: ReshootReason;
}

export interface ReshootSceneResponse {
  task_id: string;
  /** "0.00" for `generation_failure`. */
  cost_credits: Credits;
}

// ---------------------------------------------------------------------------
// Scenes / characters / dialogue (Backend_Handoff §7.4–§7.6).
// Returned nested inside `Film` from GET /api/films/{id}.
// ---------------------------------------------------------------------------

export type SceneState = "pending" | "image_ready" | "assembled" | "failed";
export type CharacterState =
  | "pending"
  | "cie_built"
  | "ref_ready"
  | "failed";
export type DialogueLineState = "pending" | "synthesized" | "failed";
export type VoiceGender = "male" | "female" | "neutral";

export interface Scene {
  id: string;
  film_id: string;
  scene_number: number;
  description: string;
  location: string | null;
  time_of_day: string | null;
  state: SceneState;
  /** Resolved signed URL for the scene image. Backend signs; never sign
   * client-side (see Leon's note in src/types/film.ts). */
  image_url: string | null;
  clip_url: string | null;
  duration_seconds: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  film_id: string;
  name: string;
  description: string | null;
  cie_description: string | null;
  reference_image_url: string | null;
  voice_id: string | null;
  voice_gender: VoiceGender | null;
  state: CharacterState;
  failure_reason: string | null;
}

export interface DialogueLine {
  id: string;
  scene_id: string;
  character_id: string;
  line_number: number;
  text: string;
  audio_url: string | null;
  duration_seconds: number | null;
  state: DialogueLineState;
}

// ---------------------------------------------------------------------------
// Activity feed
// ActivityFeedEntry is Nemi's (`src/components/activity-feed`). We re-export
// the type so callers can `import { ActivityFeedEntry } from '@/types/api'`
// alongside the rest of the API contract — Nemi remains the source of truth
// for the shape; this is just a convenience alias.
// ---------------------------------------------------------------------------

export type { ActivityFeedEntry } from "@/components/activity-feed";

/** GET /api/me/activity/{film_id} — backfill on reload of generation screen. */
import type { ActivityFeedEntry as _ActivityFeedEntry } from "@/components/activity-feed";

export interface ActivityFeedResponse {
  events: _ActivityFeedEntry[];
}

// ---------------------------------------------------------------------------
// Billing (Backend_Handoff §8.6)
// ---------------------------------------------------------------------------

export type CreditPack = "10_films" | "50_films" | "100_films";

export interface BuyFilmsRequest {
  pack: CreditPack;
}

export interface BuyFilmsResponse {
  payment_url: string;
}

export type CreditTransactionKind =
  | "signup_bonus"
  | "purchase"
  | "film_debit"
  | "regen_debit"
  | "refund_full"
  | "refund_partial"
  | "admin_adjustment";

export interface CreditTransaction {
  id: string;
  user_id: string;
  film_id: string | null;
  kind: CreditTransactionKind;
  /** Signed: positive = credit added, negative = credit removed. NUMERIC(8,2). */
  amount: Credits;
  /** Snapshot after this transaction. */
  balance_after: Credits;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CreditsListParams {
  cursor?: string | null;
  limit?: number;
}

export interface CreditsListResponse {
  balance: Credits;
  transactions: CreditTransaction[];
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// AI Twin (Backend_Handoff §8.7)
// ---------------------------------------------------------------------------

export interface TwinUploadUrlRequest {
  filename: string;
  /** MIME type, e.g. "audio/mpeg" or "image/jpeg". */
  content_type: string;
}

export interface TwinUploadUrlResponse {
  upload_url: string;
  key: string;
  expires_at: string;
}

export interface TwinTrainRequest {
  /** R2 keys returned by the upload-url responses. */
  sample_keys: string[];
}

export interface TwinTrainResponse {
  task_id: string;
}

export interface TwinStatusEntry {
  status: TwinStatus;
  /** Signed URL for the playable / viewable preview, or null. */
  sample_url?: string | null;
  preview_url?: string | null;
}

export interface TwinsStatusResponse {
  voice: TwinStatusEntry;
  face: TwinStatusEntry;
}

// ---------------------------------------------------------------------------
// Exports (Backend_Handoff §8.5)
// ---------------------------------------------------------------------------

export type ExportFormat = "mp4" | "book-pdf" | "website-zip";

export type ExportStatus = "pending" | "processing" | "ready" | "failed";

export interface ExportTaskResponse {
  task_id: string;
}

export interface ExportStatusResponse {
  status: ExportStatus;
  url: string | null;
  expires_at: string | null;
}

export interface SignedDownloadResponse {
  url: string;
  /** ISO 8601. URL valid for 1 hour per §8.5. */
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Error envelope (Backend_Handoff §8 preamble)
// ---------------------------------------------------------------------------

/** Wire shape: `{ "error": { "code", "message", "details" } }`. */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Known error codes the UI branches on. Add new codes here when the backend
 * defines one, so Stratum can map it to a Brand-voice string in copy.ts (CC-6).
 */
export type KnownErrorCode =
  | "insufficient_films"
  | "film_in_progress"
  | "scene_already_reshooting"
  | "session_expired"
  | "rate_limited"
  | "provider_unavailable"
  | "validation_error"
  | "not_found"
  | "forbidden"
  | "unknown";

/**
 * Thrown by the API client (`src/lib/api/client.ts`, S5). Carries the
 * structured backend code so UIs can branch on `err.code === 'insufficient_films'`
 * without parsing strings. The `message` is already friendly per CC-6 — never
 * a raw provider code.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: KnownErrorCode | string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: KnownErrorCode | string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
