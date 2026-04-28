// Hardcoded sample data for local-dev-without-a-backend mode.
//
// Stratum's TanStack Query hooks in `use-films.ts` resolve their queryFns and
// mutationFns against these fixtures until the real Supabase / API client
// (S5) lands. The env flag is preserved for component-level branching (Leon's
// pages, the nav components) but is NOT load-bearing for hook correctness —
// the hooks always return data, the fixtures just stand in for live calls.

import type {
  CancelFilmResponse,
  CreateFilmResponse,
  DeleteFilmResponse,
  DuplicateFilmResponse,
  Film,
  FilmStateSnapshot,
  FilmSummary,
  FilmsListResponse,
  Profile,
  ReshootSceneResponse,
} from "@/types/api";

/** Returns true when fixtures should be used in place of real network calls.
 *
 * Must use literal `process.env.NEXT_PUBLIC_USE_HARDCODED` access — Next.js
 * only inlines `NEXT_PUBLIC_*` vars when the key is a static property name.
 * Computed access (`process.env[someVar]`) leaves the lookup at runtime,
 * which on the client returns undefined (browser `process.env` is a stub)
 * while the server still sees the real Node env, causing hydration mismatch
 * on every consumer of this flag (welcome line, balance badge, profile chip). */
export function useHardcodedFixtures(): boolean {
  return process.env.NEXT_PUBLIC_USE_HARDCODED === "true";
}

// ---------------------------------------------------------------------------
// Fixture profile — drives <ProfileChip />, Home's H1, and balance badge.
// ---------------------------------------------------------------------------

export const FIXTURE_PROFILE: Profile = {
  id: "fixture-user-001",
  display_name: "Javaris",
  first_name: "Javaris",
  avatar_url: null,
  films_remaining: "3.00",
  theme_preference: "dark",
  reduced_motion: false,
  voice_twin_status: "ready",
  voice_twin_key: "users/fixture-user-001/voice_twin/sample_a.mp3",
  face_twin_status: "ready",
  face_twin_key: "users/fixture-user-001/face_twin/reference.png",
  onboarding_completed_at: "2026-04-20T12:00:00Z",
};

// ---------------------------------------------------------------------------
// Fixture film catalog — twelve summaries spanning ~5 weeks. Used by Home's
// recent row and Projects' infinite list. The order here is `created_desc`;
// queries sort/filter against it client-side to mirror server semantics.
// ---------------------------------------------------------------------------

export const FIXTURE_FILMS: FilmSummary[] = [
  {
    id: "fixture-film-001",
    title: "The Last Reel",
    state: "complete",
    created_at: "2026-04-22T18:14:00Z",
    completed_at: "2026-04-22T18:21:38Z",
    scene_count: 7,
    duration_seconds: 184,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: null,
  },
  {
    id: "fixture-film-002",
    title: "Coffee at Midnight",
    state: "complete",
    created_at: "2026-04-19T09:02:14Z",
    completed_at: "2026-04-19T09:07:51Z",
    scene_count: 5,
    duration_seconds: 142,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-04-19T09:08:30Z",
  },
  {
    id: "fixture-film-003",
    title: "Letters from the West Bank",
    state: "complete",
    created_at: "2026-04-15T21:48:02Z",
    completed_at: "2026-04-15T21:55:09Z",
    scene_count: 9,
    duration_seconds: 251,
    cover_image_url: null,
    is_incomplete: true,
    viewed_at: "2026-04-15T21:56:00Z",
  },
  {
    id: "fixture-film-004",
    title: "Untitled draft",
    state: "canceled",
    created_at: "2026-04-12T11:30:11Z",
    completed_at: null,
    scene_count: 0,
    duration_seconds: null,
    cover_image_url: null,
    viewed_at: "2026-04-12T11:32:00Z",
  },
  {
    id: "fixture-film-005",
    title: "Quiet Cars",
    state: "complete",
    created_at: "2026-04-08T13:45:00Z",
    completed_at: "2026-04-08T13:51:22Z",
    scene_count: 6,
    duration_seconds: 167,
    cover_image_url: null,
    viewed_at: "2026-04-08T14:00:00Z",
  },
  {
    id: "fixture-film-006",
    title: "How to Disappear",
    state: "complete",
    created_at: "2026-04-04T19:20:00Z",
    completed_at: "2026-04-04T19:27:48Z",
    scene_count: 8,
    duration_seconds: 215,
    cover_image_url: null,
    viewed_at: "2026-04-04T19:30:00Z",
  },
  {
    id: "fixture-film-007",
    title: "The Bridge Hour",
    state: "complete",
    created_at: "2026-04-01T08:11:00Z",
    completed_at: "2026-04-01T08:18:33Z",
    scene_count: 7,
    duration_seconds: 198,
    cover_image_url: null,
    viewed_at: "2026-04-01T08:20:00Z",
  },
  {
    id: "fixture-film-008",
    title: "Rain on the Window",
    state: "complete",
    created_at: "2026-03-28T22:05:00Z",
    completed_at: "2026-03-28T22:12:14Z",
    scene_count: 4,
    duration_seconds: 118,
    cover_image_url: null,
    viewed_at: "2026-03-28T22:15:00Z",
  },
  {
    id: "fixture-film-009",
    title: "Two Dogs and a Train",
    state: "complete",
    created_at: "2026-03-24T15:42:00Z",
    completed_at: "2026-03-24T15:49:01Z",
    scene_count: 6,
    duration_seconds: 172,
    cover_image_url: null,
    viewed_at: "2026-03-24T15:50:00Z",
  },
  {
    id: "fixture-film-010",
    title: "After the Storm",
    state: "complete",
    created_at: "2026-03-19T10:33:00Z",
    completed_at: "2026-03-19T10:40:55Z",
    scene_count: 8,
    duration_seconds: 224,
    cover_image_url: null,
    viewed_at: "2026-03-19T10:45:00Z",
  },
  {
    id: "fixture-film-011",
    title: "Slow Streets",
    state: "complete",
    created_at: "2026-03-15T17:18:00Z",
    completed_at: "2026-03-15T17:25:09Z",
    scene_count: 5,
    duration_seconds: 156,
    cover_image_url: null,
    viewed_at: "2026-03-15T17:30:00Z",
  },
  {
    id: "fixture-film-012",
    title: "First Cut",
    state: "complete",
    created_at: "2026-03-10T09:55:00Z",
    completed_at: "2026-03-10T10:02:48Z",
    scene_count: 6,
    duration_seconds: 181,
    cover_image_url: null,
    viewed_at: "2026-03-10T10:10:00Z",
  },
];

// ---------------------------------------------------------------------------
// Subscription fixture — drives /settings/billing's PlanTiles + BalanceHero.
// The shape is local to the frontend until Backend_Handoff §8.x adds a real
// /api/me/subscription endpoint (Layer 5).
// ---------------------------------------------------------------------------

export type SubscriptionPlan = "indie" | "director" | "studio";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";
export type SubscriptionInterval = "monthly" | "annual";

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  interval: SubscriptionInterval;
  /** ISO 8601 — when the period renews (or ends, if canceled). */
  renews_at: string;
  films_per_period: number;
  films_used_this_period: number;
}

export const FIXTURE_SUBSCRIPTION: Subscription = {
  plan: "director",
  status: "active",
  interval: "monthly",
  renews_at: "2026-05-22T00:00:00Z",
  films_per_period: 50,
  films_used_this_period: 8,
};

export interface InvoiceFixture {
  id: string;
  date: string;
  plan: SubscriptionPlan;
  credits: number;
  amount: string;
}

export const FIXTURE_INVOICES: InvoiceFixture[] = [
  {
    id: "in_1042",
    date: "2026-04-22T00:00:00Z",
    plan: "director",
    credits: 50,
    amount: "29.00",
  },
  {
    id: "in_1027",
    date: "2026-03-22T00:00:00Z",
    plan: "director",
    credits: 50,
    amount: "29.00",
  },
  {
    id: "in_1009",
    date: "2026-02-22T00:00:00Z",
    plan: "indie",
    credits: 10,
    amount: "9.00",
  },
];

export interface PaymentMethodFixture {
  brand: string;
  last4: string;
  exp: string;
}

export const FIXTURE_PAYMENT_METHOD: PaymentMethodFixture = {
  brand: "Visa",
  last4: "4242",
  exp: "12/27",
};

// ---------------------------------------------------------------------------
// In-progress film — Home's EC-G3 card. Flip to `null` to demo the no-active
// state without rebuilding.
// ---------------------------------------------------------------------------

export const FIXTURE_IN_PROGRESS_FILM: FilmSummary | null = {
  id: "fixture-film-active",
  title: "The Long Walk Home",
  state: "scene_images_pending",
  created_at: "2026-04-24T17:58:00Z",
  completed_at: null,
  scene_count: 6,
  duration_seconds: null,
  cover_image_url: null,
  viewed_at: null,
};

// ---------------------------------------------------------------------------
// Helpers used by the query hooks.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 8;

export function fixtureFilmDetail(filmId: string): Film {
  const summary =
    FIXTURE_FILMS.find((f) => f.id === filmId) ??
    FIXTURE_IN_PROGRESS_FILM ??
    FIXTURE_FILMS[0]!;
  return {
    ...summary,
    id: summary.id === filmId ? summary.id : filmId,
    title: summary.title,
    script_text:
      "INT. APARTMENT — NIGHT\n\nA single lamp glows. RAYA stands at the window.\n\nRAYA\n(softly)\nThe city sounds different tonight.",
    style_preset: "cinematic-warm",
    aspect_ratio: "16:9",
    state_error_reason: null,
    deleted_at: null,
    permanent_delete_at: null,
  };
}

export function fixtureFilmStateSnapshot(filmId: string): FilmStateSnapshot {
  const film =
    FIXTURE_FILMS.find((f) => f.id === filmId) ??
    FIXTURE_IN_PROGRESS_FILM ??
    FIXTURE_FILMS[0]!;
  return {
    state: film.state,
    current_phase_detail: {},
    scene_count: film.scene_count,
    scenes_ready: film.state === "complete" ? film.scene_count : 0,
    last_event_at: film.completed_at ?? film.created_at,
  };
}

export function fixtureFilmsPage(
  params: {
    cursor?: string | null;
    search?: string;
    sort?: "created_desc" | "created_asc" | "title_asc";
  } = {},
): FilmsListResponse {
  const { cursor, search, sort = "created_desc" } = params;

  const filtered = search
    ? FIXTURE_FILMS.filter((f) =>
        f.title.toLowerCase().includes(search.toLowerCase()),
      )
    : FIXTURE_FILMS.slice();

  const sorted = filtered.sort((a, b) => {
    if (sort === "title_asc") return a.title.localeCompare(b.title);
    const aT = Date.parse(a.created_at);
    const bT = Date.parse(b.created_at);
    return sort === "created_asc" ? aT - bT : bT - aT;
  });

  const offset = cursor ? parseInt(cursor, 10) || 0 : 0;
  const slice = sorted.slice(offset, offset + PAGE_SIZE);
  const next = offset + PAGE_SIZE < sorted.length ? String(offset + PAGE_SIZE) : null;
  return { films: slice, next_cursor: next };
}

// ---------------------------------------------------------------------------
// Mutation response builders. Each shape matches the API contract in api.ts.
// ---------------------------------------------------------------------------

export function fixtureCreateFilmResponse(): CreateFilmResponse {
  return {
    film_id: `fixture-film-${Math.floor(Math.random() * 1_000_000)}`,
    state: "pending",
  };
}

export function fixtureCancelFilmResponse(): CancelFilmResponse {
  return {
    refund_amount: "0.80",
    canceled_at: new Date().toISOString(),
  };
}

export function fixtureReshootResponse(reason: string): ReshootSceneResponse {
  return {
    task_id: `fixture-task-${Math.floor(Math.random() * 1_000_000)}`,
    cost_credits: reason === "generation_failure" ? "0.00" : "0.20",
  };
}

export function fixtureDeleteResponse(): DeleteFilmResponse {
  const purgeAt = new Date();
  purgeAt.setDate(purgeAt.getDate() + 30);
  return { deletion_scheduled_for: purgeAt.toISOString() };
}

export function fixtureDuplicateResponse(): DuplicateFilmResponse {
  return {
    film_id: `fixture-film-${Math.floor(Math.random() * 1_000_000)}`,
    state: "pending",
  };
}
