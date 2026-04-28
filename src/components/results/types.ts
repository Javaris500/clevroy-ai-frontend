// Local Kaiser type — extends Leon's `Film` (`src/types/film.ts`) with the
// nested arrays Backend_Handoff §8.3 says GET /api/films/{id} returns. Leon's
// current `Film` shape only carries the summary + soft-delete fields; the
// Results page needs scenes, characters, and dialogue lines. When Leon adds
// these arrays to `Film`, delete this file and use `Film` directly.
//
// Also surfaces a per-film api_call_log + credit cost summary used by the
// Metadata tab. Both shapes are not yet wired to a backend route in §8 — the
// Metadata tab renders them when present and hides the corresponding subsection
// when absent.

import type { Character, DialogueLine, Scene } from "@/types/api";
import type { Film } from "@/types/film";

export interface FilmDetails extends Film {
  scenes: Scene[];
  characters: Character[];
  dialogue_lines: DialogueLine[];
  /** Per-provider call log for the Metadata tab. Optional — backend may not
   * surface this on the film record yet. */
  api_calls?: ApiCallSummary[];
  /** Credit cost breakdown by phase. Optional for the same reason. */
  cost_breakdown?: CostBreakdown;
}

export interface ApiCallSummary {
  /** ISO 8601. */
  occurred_at: string;
  provider: string;
  model: string;
  /** Unsigned integer. */
  latency_ms: number;
  /** NUMERIC(8,2) string — never coerce. Display via parseFloat at the leaf. */
  cost_usd: string;
  status: "success" | "failure" | "retry";
}

export interface CostBreakdownLine {
  label: string;
  /** NUMERIC(8,2) string. */
  amount_credits: string;
}

export interface CostBreakdown {
  /** Sum of all lines, NUMERIC(8,2) string. */
  total_credits: string;
  lines: CostBreakdownLine[];
}
