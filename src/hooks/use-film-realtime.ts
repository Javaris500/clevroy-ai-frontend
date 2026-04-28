// Stratum — Supabase Realtime subscription hook for the generation screen.
// Contract only (S0). Implementation lands in S7 (after Supabase clients +
// API client). The shape below is what Fantem's <CenterStage /> and Nemi's
// <ActivityFeed /> consume.
//
// What the implementation will do (S7):
// - Subscribe to `films:id=eq.{filmId}` and `scenes:film_id=eq.{filmId}`
//   (Backend_Handoff §7.3, §7.4). Realtime is a notification channel, not the
//   source of truth (§10.11) — payloads always trigger a reconcile.
// - On disconnect: exponential backoff 1s, 2s, 4s, 8s, max 15s (EC-G2).
// - On reconnect: REST catch-up via GET /api/films/{id}/state and any missing
//   activity events via GET /api/me/activity/{id}, then resume live streaming.
// - Synthesize ActivityFeedEntry items from row updates so Nemi's feed renders
//   the same entries whether they came over the wire or via REST backfill.

import type {
  ActivityFeedEntry,
  FilmStateSnapshot,
} from "@/types/api";

export type RealtimeStatus =
  | "idle" // no filmId yet
  | "connecting"
  | "connected"
  | "reconnecting" // disconnected and retrying
  | "disconnected" // gave up after max retries (rare)
  | "error"; // unrecoverable, e.g., RLS denied

export interface UseFilmRealtimeResult {
  /** Current connection status. Drives EC-G2's banner. */
  status: RealtimeStatus;
  /** Latest snapshot from REST catch-up + Realtime payloads merged together.
   * Null until the first response lands. Source of truth for the generation
   * screen's phase rendering — Realtime is just notification (§10.11). */
  snapshot: FilmStateSnapshot | null;
  /** Activity feed entries, oldest first. Capped at the latest 200 in memory;
   * Nemi's <ActivityFeed /> handles further DOM virtualization (EC-G7). */
  events: ActivityFeedEntry[];
  /** Most-recent event for convenience (= events[events.length - 1] || null). */
  lastEvent: ActivityFeedEntry | null;
  /** Force a REST reconcile without waiting for the next Realtime payload.
   * Called on Capacitor `App.resume` and `visibilitychange` (EC-G1). */
  reconcile: () => void;
}

/**
 * Subscribe to a film's Realtime channel.
 *
 * Pass `undefined` while the filmId isn't known yet (e.g., during
 * `POST /api/films` mutation flight) — the hook returns idle status and no
 * subscription is opened. Once the id is known, the hook opens the channel
 * and starts streaming.
 */
export function useFilmRealtime(
  _filmId: string | undefined,
): UseFilmRealtimeResult {
  throw new Error(
    "[Stratum stub] useFilmRealtime() not implemented yet. Lands in S7. " +
      "See coordination.md → Stratum.",
  );
}
