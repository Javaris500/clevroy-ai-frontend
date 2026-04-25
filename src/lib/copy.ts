// Single source of truth for user-facing strings. Every string must live
// here so the CI copy audit (UX_Edge_Cases CC-6) can lint against forbidden
// words from Brand_Guide §6.3. Each agent adds their keys under a clearly
// labeled section divider — keep sections scoped by surface (not by agent
// name) so this file survives reassignments.
//
// Forbidden in product copy (from Brand_Guide §6.3):
//   magical / magic / magically, AI-powered / AI-driven / powered by AI,
//   seamless / frictionless / effortless, next-generation / cutting-edge,
//   simply / just / easily (as intensifiers), "Oops!" or surprised interjections,
//   "users" (use "you" / "filmmakers"), the word "credits" in user-facing UI
//   (use "films"), emoji in product copy.
//
// Tone rules (Brand_Guide §6): crafted not casual, confident + honest, plainspoken.
// Phase narration is present-tense, first-person-as-Clevroy
// (Design_System §8.3 — "Reading your script" not "Script is being read").

import type { FilmState, SceneStatus } from "@/types/film-state";

export type NarrationContext = {
  currentScene?: number;
  totalScenes?: number;
  voiceProvider?: string;
  musicStyle?: string;
  errorDetail?: string;
};

export type NarrationEntry = {
  headline: string;
  subline: (ctx?: NarrationContext) => string;
};

// ---------------------------------------------------------------------------
// PhaseNarration — state → headline + subline
// Maps the 12-value backend state enum to the Design_System §8.3 table.
// ---------------------------------------------------------------------------

export const phaseNarration: Record<FilmState, NarrationEntry> = {
  pending: {
    headline: "Warming up…",
    subline: () => "Queuing your film.",
  },
  parsing: {
    headline: "Reading your script…",
    subline: () => "Understanding your story, scene by scene.",
  },
  cie_building: {
    headline: "Assembling the cast…",
    subline: () => "Figuring out who's in your film.",
  },
  character_refs: {
    headline: "Casting portraits…",
    subline: () =>
      "Painting reference portraits so faces stay consistent across scenes.",
  },
  scene_images_pending: {
    headline: "Blocking the scenes…",
    subline: (ctx) =>
      ctx?.currentScene && ctx?.totalScenes
        ? `Working on scene ${ctx.currentScene} of ${ctx.totalScenes}.`
        : "Working on your scenes.",
  },
  voice_synthesis: {
    headline: "Finding voices…",
    subline: (ctx) =>
      ctx?.voiceProvider
        ? `Recording dialogue lines with ${ctx.voiceProvider}.`
        : "Recording dialogue lines.",
  },
  music_composition: {
    headline: "Scoring the film…",
    subline: (ctx) =>
      ctx?.musicStyle
        ? `Composing a soundtrack in the ${ctx.musicStyle} style.`
        : "Composing your soundtrack.",
  },
  scene_assembly: {
    headline: "Cutting scene…",
    // Headline carries the scene number when known; keep the verb-first phrasing.
    subline: () => "Putting picture, voice, and score together.",
  },
  final_concat: {
    headline: "Final cut…",
    subline: () => "Stitching your film into one take.",
  },
  complete: {
    headline: "Your film is ready.",
    subline: () => "Take a look.",
  },
  error: {
    headline: "We missed a shot.",
    subline: (ctx) =>
      ctx?.errorDetail
        ? `${ctx.errorDetail} You can reshoot it without losing progress.`
        : "One step didn't render. You can reshoot it without losing progress.",
  },
  canceled: {
    headline: "Stopped.",
    subline: () => "Your script is saved.",
  },
};

// `scene_assembly` headline includes the scene number when available.
// Kept as a helper so the state→headline lookup stays a simple table above.
export function headlineForState(
  state: FilmState,
  ctx?: NarrationContext,
): string {
  if (state === "scene_assembly" && ctx?.currentScene) {
    return `Cutting scene ${ctx.currentScene}…`;
  }
  return phaseNarration[state].headline;
}

// ---------------------------------------------------------------------------
// SceneStrip — accessibility labels
// ---------------------------------------------------------------------------

export const sceneStripStatusLabel: Record<SceneStatus, string> = {
  empty: "Pending",
  pending: "Rendering",
  ready: "Ready",
  active: "Rendering now",
  error: "Didn't render",
};

export function sceneStripAriaLabel(
  sceneNumber: number,
  status: SceneStatus,
): string {
  return `Scene ${sceneNumber}, ${sceneStripStatusLabel[status]}`;
}

// ---------------------------------------------------------------------------
// ActivityFeed — controls + announcements
// ---------------------------------------------------------------------------

export const activityFeed = {
  jumpToLatest: "Jump to latest",
  viewEarlier: (count: number) =>
    count === 1 ? "View earlier event (1)" : `View earlier events (${count})`,
  ariaRegionLabel: "Generation activity",
} as const;

// ---------------------------------------------------------------------------
// Stratum — (reserved section for Realtime-driven event formatters)
// Add keys below this line. Keep one export object per concern so git merges
// stay localized.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Leon — Home, Projects, FilmCard, empty states.
// "films" surface language per Brand_Guide §5.3. Destructive actions keep the
// plain "Delete" verb per §5.4. Modal copy and the deep-link not-found state
// are mirrored from Brand_Guide §7.4–§7.5 and Design_System §7.3 verbatim.
// ---------------------------------------------------------------------------

export const home = {
  /** H1 with first-name interpolation. Falls back to "Welcome back" when the
   * user record hasn't loaded yet — never render an empty interpolation slot. */
  welcomeHeading: (firstName: string | null | undefined) =>
    firstName && firstName.trim().length > 0
      ? `Welcome back, ${firstName.trim()}`
      : "Welcome back",
  /** Sub-line. `films` is a stringified NUMERIC(8,2) — never coerced to Number
   * here; the caller already chose how to render it. */
  filmsLeftSubline: (films: string) => `You have ${films} films left.`,
  buyMoreFilmsLink: "Buy more films",
  startNewFilmCardTitle: "Start a new film",
  recentFilmsHeading: "Recent films",
  viewAllRecent: "View all",
  filmInProgressLabel: "Film in progress",
  filmInProgressLiveLabel: "Live",
} as const;

export const projects = {
  pageHeading: "Your Films",
  searchPlaceholder: "Search your films",
  newFilmButton: "New film",
  sort: {
    label: "Sort",
    createdDesc: "Newest first",
    createdAsc: "Oldest first",
    titleAsc: "Title (A–Z)",
  },
  loadingMore: "Loading more films…",
  endOfList: "That's everything you've shot.",
} as const;

export const filmCard = {
  /** Three-dot overflow menu items. "Delete" stays plain per Brand_Guide §5.4. */
  menu: {
    rename: "Rename",
    duplicate: "Duplicate",
    delete: "Delete",
  },
  /** EC-N9: tooltip explaining why Delete is disabled while a film is mid-flow. */
  deleteDisabledTooltip: "Still being shot. Cancel first, then delete.",
  newBadge: "New",
  incompleteBadge: "Incomplete",
  inProgressBadge: "Shooting",
  /** Aria description for screen readers (CC-5). Read in addition to the
   * visible title so the state isn't lost to non-sighted users. */
  cardAriaSuffix: (sceneCount: number) =>
    sceneCount === 1 ? "1 scene" : `${sceneCount} scenes`,
} as const;

export const deleteFilmDialog = {
  // Verbatim from Brand_Guide §7.5.
  title: "Delete this film?",
  description: "It can't be recovered.",
  cancel: "Keep it",
  confirm: "Delete it",
} as const;

export const emptyStates = {
  noFilms: {
    // Verbatim from Design_System §7.2 / Brand_Guide §7.4.
    headline: "No films yet.",
    description: "Paste a script and we'll start shooting.",
    cta: "Start your first film",
    freeFilmsHint: "You have 5 free films to start. No credit card needed.",
  },
  filmNotFound: {
    // EC-N8: 404 and 403 share the exact same copy by design.
    headline: "We couldn't find that film.",
    description: "It may have been deleted or moved.",
    cta: "Back to your films",
  },
  filmRestore: {
    // EC-N8: soft-deleted within 30-day recovery window.
    headline: (deletedAt: string) => `You deleted this film on ${deletedAt}.`,
    description: (purgeAt: string) =>
      `It will be permanently removed on ${purgeAt}.`,
    restoreCta: "Restore",
  },
} as const;

export const stillLoading = "Still loading your films…";

// ---------------------------------------------------------------------------
// Leia — global primitives & shared verb registries.
// Global_Design_Rules §2.2 mandates ConfirmDialog reads its cancel/confirm
// labels from this registry so verb pairs stay consistent across the product.
// ---------------------------------------------------------------------------

/**
 * Canonical (cancel, confirm) verb pairs for ConfirmDialog. Add new keys
 * here — never write a one-off pair at the call site. Brand_Guide §5.4 keeps
 * "Delete" and "Cancel" as plain words (destructive clarity beats flavor).
 */
export const confirmVerbPairs = {
  /** Brand_Guide §7.5 — generic destructive delete. */
  delete: { cancel: "Keep it", confirm: "Delete it" },
  /** EC-G6 — cancel an in-flight generation. */
  cancelGeneration: { cancel: "Keep going", confirm: "Stop" },
  /** EC-G8 — reshoot a single scene from Results / error state. */
  reshootScene: { cancel: "Cancel", confirm: "Reshoot" },
  /** EC-N4 — sign out while a film is generating. */
  signOutDuringGeneration: { cancel: "Stay signed in", confirm: "Sign out" },
  /** Settings → Account — permanent delete of the user's account. */
  deleteAccount: { cancel: "Keep my account", confirm: "Delete account" },
  /** Generic confirm with no destructive intent. */
  confirm: { cancel: "Cancel", confirm: "Confirm" },
} as const;

export type ConfirmVerbKey = keyof typeof confirmVerbPairs;

