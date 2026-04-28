// Smart-grouping helper for /projects (Settings_Projects_Brief A.4.5 + A.7 §4).
//
// When the user has 8+ films AND sort is "Newest first" AND there's no
// active search, the grid groups by recency: This week / This month /
// Earlier. Cuts the database-table feel; turns the list into a memory shelf.
//
// Empty groups are skipped at the call site; callers don't render eyebrows
// for groups with zero films.

import type { FilmSummary } from "@/types/film";
import { projects } from "@/lib/copy";

const ONE_DAY_MS = 24 * 60 * 60 * 1_000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

export type FilmRecencyGroupKey = "thisWeek" | "thisMonth" | "earlier";

export type FilmRecencyGroup = {
  key: FilmRecencyGroupKey;
  /** Visible eyebrow label sourced from `projects.group` in copy.ts. */
  label: string;
  films: FilmSummary[];
};

export const RECENCY_GROUP_THRESHOLD = 8;

/**
 * Bucket a sorted (newest-first) list of films by recency relative to `now`.
 * The input is not re-sorted — callers are expected to pass a list already
 * in newest-first order (the helper is only invoked when sort is
 * `created_desc`). Output preserves order within each bucket.
 *
 * Empty buckets are dropped from the returned array, so the call site can
 * map directly without rendering empty headers.
 */
export function groupFilmsByRecency(
  films: ReadonlyArray<FilmSummary>,
  now: number = Date.now(),
): ReadonlyArray<FilmRecencyGroup> {
  const thisWeek: FilmSummary[] = [];
  const thisMonth: FilmSummary[] = [];
  const earlier: FilmSummary[] = [];

  for (const film of films) {
    const createdAt = Date.parse(film.created_at);
    if (!Number.isFinite(createdAt)) {
      // Bad timestamp — bucket as "Earlier" so it still renders. The
      // backend should never hand us this, but we don't want to drop a
      // film silently in the UI.
      earlier.push(film);
      continue;
    }
    const age = now - createdAt;
    if (age < SEVEN_DAYS_MS) thisWeek.push(film);
    else if (age < THIRTY_DAYS_MS) thisMonth.push(film);
    else earlier.push(film);
  }

  const out: FilmRecencyGroup[] = [];
  if (thisWeek.length > 0) {
    out.push({ key: "thisWeek", label: projects.group.thisWeek, films: thisWeek });
  }
  if (thisMonth.length > 0) {
    out.push({
      key: "thisMonth",
      label: projects.group.thisMonth,
      films: thisMonth,
    });
  }
  if (earlier.length > 0) {
    out.push({ key: "earlier", label: projects.group.earlier, films: earlier });
  }
  return out;
}
