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
// Phase caption — short, card-fit phrasing used by FilmCard's live-shooting
// treatment on /projects (Settings_Projects_Brief A.7 §2). The full
// `phaseNarration` headlines are too long for a card row; these are two- or
// three-word verbs in title-case-ish JetBrains-Mono context. Verbs only,
// present-tense, Brand_Guide §6 voice.
// ---------------------------------------------------------------------------

const phaseCaption: Record<FilmState, string> = {
  pending: "Queuing",
  parsing: "Reading the script",
  cie_building: "Assembling the cast",
  character_refs: "Casting portraits",
  scene_images_pending: "Directing scenes",
  voice_synthesis: "Recording voices",
  music_composition: "Scoring",
  scene_assembly: "Cutting",
  final_concat: "Final cut",
  complete: "Ready",
  error: "Stopped",
  canceled: "Stopped",
};

export function phaseCaptionForState(
  state: FilmState,
  ctx?: { currentScene?: number },
): string {
  if (state === "scene_images_pending" && ctx?.currentScene) {
    return `Directing scene ${ctx.currentScene}`;
  }
  if (state === "scene_assembly" && ctx?.currentScene) {
    return `Cutting scene ${ctx.currentScene}`;
  }
  return phaseCaption[state];
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
  /** Chat-surface welcome line for /home (Clevroy_Chat_Surface.md §13.1).
   * Renders in Fraunces italic via the `text-phase` utility. The chat
   * input sits directly below this line. */
  chatWelcomeLine: (firstName: string | null | undefined) =>
    firstName && firstName.trim().length > 0
      ? `Welcome back, ${firstName.trim()}. What's the next film?`
      : "Welcome back. What's the next film?",
  /** Time-of-day variant. Hour buckets:
   *  5–11 morning · 11–17 afternoon · 17–22 evening · 22–5 late night. */
  chatWelcomeLineForHour: (
    firstName: string | null | undefined,
    hour: number,
  ) => {
    const name =
      firstName && firstName.trim().length > 0 ? firstName.trim() : null;
    const lead = name ? `, ${name}` : "";
    if (hour >= 5 && hour < 11) {
      return `Morning${lead}. What's the next film?`;
    }
    if (hour >= 17 && hour < 22) {
      return `Welcome back${lead}. Tonight's film?`;
    }
    if (hour >= 22 || hour < 5) {
      return `Late night film${lead}?`;
    }
    return name
      ? `Welcome back, ${name}. What's the next film?`
      : "Welcome back. What's the next film?";
  },
  /** Call-sheet meta line below the welcome (JetBrains Mono). */
  callSheetMeta: (title: string, relative: string) =>
    `Last shot · ${title} · ${relative}`,
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
  /** Layout_Enhancements A.7 — filter-chip labels. Brand voice: plain and
   *  scannable. "Shooting" mirrors the FilmCard `inProgressBadge`; "Didn't
   *  render" replaces the bald "Error" per Brand_Guide §6.3 (errors are
   *  always framed as a missed shot). */
  filter: {
    label: "Filter by status",
    all: "All",
    inProgress: "Shooting",
    complete: "Complete",
    error: "Didn't render",
  },
  loadingMore: "Loading more films…",
  endOfList: "That's everything you've shot.",
  /** Pinned shelf eyebrows (Settings_Projects_Brief A.4.2). */
  shelf: {
    rightNow: "Right now",
    recent: "Recent",
  },
  /** Smart grouping (Settings_Projects_Brief A.4.5). */
  group: {
    thisWeek: "This week",
    thisMonth: "This month",
    earlier: "Earlier",
  },
  /** Clear-filters affordance shown in the empty-results state when the user
   *  has applied search/filter that returns nothing. */
  clearFilters: "Clear filters",
  noFiltersHeadline: "No films match those filters.",
  noFiltersBody: "Try clearing the filters or searching for a different title.",
  /** Inline action on `error`-state cards. Layer 5 owns the retry mutation. */
  tryAgain: "Try again",
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
  /** /projects-specific empty state. Layout_Enhancements A.9 — Fraunces phase
   *  line carries the cinematic hand-off from the Create flow into the empty
   *  archive view. Body sits below in regular Inter. */
  projectsEmpty: {
    phaseLine: "Your reel starts here.",
    description:
      "Every film you shoot lands here. Start one and watch it come together.",
    cta: "Start your first film",
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

// ---------------------------------------------------------------------------
// Ghost — Settings, Billing, AI Twin, Onboarding, route-level error / 404,
// global toast helpers (EC-G10).
//
// "films" surface language per Brand_Guide §5.3 holds across these surfaces
// EXCEPT inside Billing — billing/invoice line items keep the literal "credits"
// word per §5.3, and the credit-pack labels stay phrased around films because
// that's the unit the user is actually buying.
// ---------------------------------------------------------------------------

/** Route-level error.tsx (Brand_Guide §7.3 — never "Oops"). The error page
 *  always names the specific thing that failed. */
export const routeError = {
  fallbackTitle: "This page didn't load.",
  fallbackBody: "Check your connection and try again.",
  retry: "Try again",
  backHome: "Back to home",
} as const;

/** App-level not-found.tsx — distinct from Leon's deep-link film 404. */
export const routeNotFound = {
  title: "We couldn't find that page.",
  body: "The link may be wrong, or the page may have moved.",
  cta: "Back to home",
} as const;

/** Toast strings (EC-G10). Surface from anywhere in the app. */
export const globalToasts = {
  filmReady: {
    title: "Your film is ready.",
    body: "Take a look.",
    action: "Watch",
  },
  filmError: {
    title: "Your film hit a problem.",
    body: "We saved what finished.",
    action: "View",
  },
  filmRefunded: (refunded: string) => ({
    title: "Stopped.",
    body: `${refunded} films refunded to your balance.`,
  }),
  /** Optimistic delete (Settings_Projects_Brief A.6): toast surfaces with
   *  an Undo action for 5 seconds; on undo the film is restored to the
   *  cache. Brand_Guide §5.4 keeps "Deleted." as a plain verb. */
  filmDeleted: {
    title: "Deleted.",
    action: "Undo",
  },
  filmDeleteUndone: "Restored to your reel.",
  inProgressNavigation: {
    title: "Your film is still being shot.",
    body: "Click to watch.",
  },
  sceneAlreadyReshooting: "That scene is already being reshot.",
  reconnected: "Reconnected.",
  connectionLost: "Lost connection. Reconnecting…",
} as const;

// ---------------------------------------------------------------------------
// Ghost — Onboarding (CC-1)
// ---------------------------------------------------------------------------

export const onboarding = {
  theme: {
    // Step 1. Verbatim CC-1 wording, plus an eyebrow line that absorbs
    // what used to be the welcome step. Two screens total now — welcome
    // was redundant with the home page CTA.
    eyebrow: "Your script. On screen. Now.",
    title: "Pick a look.",
    body: "Clevroy's studio mode is dark by default. Switch to light if you prefer.",
    keepDark: "Keep dark",
    switchToLight: "Switch to light",
    /** Caption inside the dark/light preview cards. */
    previewTitle: "The first take",
    previewMeta: "Scene 1 · 00:08",
  },
  start: {
    // Step 2. Faux scene-strip animates in to demo what the user is about
    // to make. Captions are invented but on-brand — never reuse a real
    // film's metadata here.
    title: "You have 5 free films to start.",
    body: "No card needed. Pick a script — even a paragraph works — and we'll do the rest.",
    cta: "Start your first film",
    skipToHome: "Maybe later",
    /** Three faux scene-strip frames that develop in sequence. */
    previewFrames: [
      { label: "Open on", caption: "A kitchen at dawn." },
      { label: "Cut to", caption: "Steam off a kettle." },
      { label: "She says", caption: "We're out of coffee." },
    ],
  },
  /** Progress dot label for screen readers. */
  stepLabel: (current: number, total: number) =>
    `Step ${current} of ${total}`,
  backLabel: "Back",
} as const;

// ---------------------------------------------------------------------------
// Ghost — Settings (Design_System §7.7)
// ---------------------------------------------------------------------------

export const settings = {
  pageTitle: "Settings",
  subline: "Account, billing, and how Clevroy looks to you.",
  nav: {
    account: "Account",
    billing: "Billing",
    preferences: "Preferences",
    notifications: "Notifications",
    developer: "Developer",
    about: "About",
  },
  /** Shell shared verbs (SaveBar, last-saved indicator, autosave toasts). */
  saveChanges: "Save changes",
  saving: "Saving…",
  discard: "Discard",
  dirtyToast: "You have unsaved changes.",
  savedToast: (field: string) => `${field} saved.`,
  lastSaved: (rel: string) => `Saved ${rel}`,
  dirtyDotAria: "Unsaved changes",
} as const;

export const settingsAccount = {
  title: "Account",
  subline: "Your name, email, and password.",
  /** Section copy for the SettingsSection wrappers. */
  profileSectionTitle: "Profile",
  profileSectionDescription: "How you appear in Clevroy.",
  emailSectionTitle: "Email",
  emailSectionDescription: "Where we send film-ready notifications and security alerts.",
  passwordSectionTitle: "Password",
  passwordSectionDescription: "Sign in with what you remember best.",
  displayNameLabel: "Display name",
  displayNameHelper: "Shown in the sidebar and on your films. 2 to 48 characters.",
  firstNameLabel: "First name",
  firstNameHelper: "Used in your welcome line. 1 to 24 characters.",
  avatarLabel: "Profile photo",
  avatarHelper: "Click the circle to upload a square photo. We crop it to a circle.",
  emailLabel: "Email",
  emailHelper: "We send film-ready notifications here.",
  changeEmail: "Change email",
  changeEmailDialog: {
    title: "Change your email?",
    body: "We'll send a confirmation link to the new address.",
    newEmailLabel: "New email",
    currentPasswordLabel: "Current password",
    submit: "Send confirmation",
    cancel: "Cancel",
  },
  passwordLabel: "Password",
  changePassword: "Change password",
  passwordDialog: {
    title: "Change your password",
    body: "Enter your current password, then pick a new one.",
    currentLabel: "Current password",
    newLabel: "New password",
    confirmLabel: "Confirm new password",
    submit: "Update password",
    cancel: "Cancel",
    mismatch: "New passwords don't match.",
    tooShort: "Use at least 8 characters.",
    strengthLabels: { weak: "Weak", fair: "Fair", strong: "Strong" } as const,
  },
  saveChanges: "Save changes",
  saved: "Saved.",
  validation: {
    displayNameRange: "Display name must be 2 to 48 characters.",
    firstNameRange: "First name must be 1 to 24 characters.",
  },
  /** Delete-account section. EC-N5 / Brand_Guide §7.5 / Design_System §7.7. */
  dangerZoneTitle: "Delete your account",
  dangerZoneBody:
    "This permanently deletes everything tied to your account. Type your email to confirm.",
  dangerZoneList: (filmCount: number, hasVoiceTwin: boolean, hasFaceTwin: boolean) => {
    const parts: string[] = [];
    if (filmCount > 0) parts.push(`Your ${filmCount} films`);
    if (hasVoiceTwin) parts.push("your voice twin");
    if (hasFaceTwin) parts.push("your face twin");
    parts.push("your billing history");
    return `${parts.join(", ")}. This can't be undone.`;
  },
  dangerZoneTypeLabel: "Type your email to confirm",
  deleteCta: "Delete account",
  deleteDialog: {
    title: "Delete your account?",
    body: "We'll hold your data for 30 days before removing it for good. Sign back in before then to cancel.",
  },
  deleteScheduled: (date: string) =>
    `Your account is scheduled for permanent deletion on ${date}. Sign back in before then to cancel.`,
} as const;

export const settingsBilling = {
  title: "Billing",
  subline: "Your plan, films balance, and invoices.",
  /** Plan tile names — chosen 2026-04-28 over the brief's suggested
   *  "Starter / Pro / Studio" because filmmakers don't think of themselves as
   *  "starter" customers. The escalating filmmaking lexicon (Indie director
   *  with one camera → working director → studio with a slate) reads as a
   *  craft path rather than SaaS tiering. */
  plans: {
    indie: {
      key: "indie" as const,
      name: "Indie",
      tagline: "One reel at a time.",
      monthlyPrice: "9",
      annualPrice: "86",
      filmsIncluded: 10,
      overageRate: "0.50",
      features: [
        "10 films per month",
        "Standard AI Twin",
        "16:9 only",
        "Email support",
      ] as const,
    },
    director: {
      key: "director" as const,
      name: "Director",
      tagline: "A short season every month.",
      monthlyPrice: "29",
      annualPrice: "278",
      filmsIncluded: 50,
      overageRate: "0.40",
      features: [
        "50 films per month",
        "Pro AI Twin",
        "All aspect ratios",
        "Priority support",
      ] as const,
    },
    studio: {
      key: "studio" as const,
      name: "Studio",
      tagline: "A working slate, anytime.",
      monthlyPrice: "79",
      annualPrice: "758",
      filmsIncluded: 150,
      overageRate: "0.30",
      features: [
        "150 films per month",
        "Studio AI Twin",
        "All aspect ratios",
        "Dedicated support",
      ] as const,
    },
  },
  balanceHero: {
    titleSubscription: (films: string) => `${films} films · this month`,
    titlePayg: (films: string) => `${films} films left`,
    captionRenews: (date: string) => `Renews on ${date}`,
    captionToppedUp: (rel: string) => `Last topped up ${rel}`,
    captionNone: "No active plan.",
  },
  plansSectionTitle: "Plan",
  plansSectionDescription: "Pick the plan that matches how often you shoot.",
  monthly: "Monthly",
  annual: "Annual",
  annualSaveBadge: "Save 20%",
  pricePerMonth: (price: string) => `$${price}/mo`,
  pricePerYear: (price: string) => `$${price}/yr`,
  filmsPerMonth: (n: number) => `${n} films · per month`,
  overage: (rate: string) => `$${rate} per additional film`,
  currentPlanBadge: "Current plan",
  upgradeCta: "Upgrade",
  downgradeCta: "Downgrade",
  choosePlanCta: "Choose plan",
  planChangeStub: (plan: string) =>
    `${plan} plan change is pending. We'll wire this up shortly.`,
  paymentSectionTitle: "Payment method",
  paymentSectionDescription: "We use Stripe for billing.",
  paymentDisplay: (last4: string, exp: string) => `Visa ending ${last4} · expires ${exp}`,
  paymentManageCta: "Manage payment method",
  invoicesSectionTitle: "Recent invoices",
  invoicesSectionDescription: "Download invoices for the last twelve months.",
  invoicesEmpty: "No invoices yet.",
  invoicesColumns: {
    date: "Date",
    plan: "Plan",
    credits: "Credits",
    amount: "Amount",
    pdf: "Invoice",
  },
  invoicePdfDownload: "Download",
  cancelSectionTitle: "Cancel subscription",
  cancelSectionDescription:
    "You'll keep access until the end of the current billing period.",
  cancelCta: "Cancel subscription",
  cancelDialog: {
    title: "Cancel your subscription?",
    body: "Your plan stays active until the end of the period. Films you've already paid for don't expire.",
    confirm: "Cancel subscription",
    keep: "Keep my plan",
  },
  buyMoreFilms: "Buy more films",
} as const;

export const settingsPreferences = {
  title: "Preferences",
  subline: "How Clevroy looks, moves, and shoots by default.",
  themeTitle: "Theme",
  themeBody:
    "Studio mode is dark by default. Light mode follows the same colors with a paper background.",
  themeOptions: {
    light: { label: "Light", caption: "Paper background." },
    dark: { label: "Dark", caption: "Studio mode." },
    system: { label: "System", caption: "Follows your device." },
  },
  themeSelectedAria: (label: string) => `${label} theme is selected.`,
  motionTitle: "Reduce motion",
  motionBody:
    "Skip the type-on intro and the idle pulse. Doesn't affect playback.",
  motionToggleLabel: "Reduce motion",
  motionToggleHelper:
    "Auto follows your device. Toggle on to force reduced motion regardless of device setting.",
  aspectTitle: "Default aspect",
  aspectBody:
    "We use this when you start a new film. You can change it on each film.",
  aspectOptions: {
    "16:9": { label: "16:9", caption: "Cinematic widescreen." },
    "9:16": { label: "9:16", caption: "Vertical, for phones." },
    "1:1": { label: "1:1", caption: "Square, for social posts." },
  },
  styleTitle: "Default style",
  styleBody:
    "Sets the look of new films. You can override it in the Create input.",
  styleOptions: {
    None: { label: "No preset", caption: "I'll pick each time." },
    Cinematic: { label: "Cinematic", caption: "Filmic light, warm grade." },
    Documentary: { label: "Documentary", caption: "Natural light, observational." },
    Noir: { label: "Noir", caption: "High contrast, deep shadows." },
    Animated: { label: "Animated", caption: "Hand-drawn warmth." },
  },
  languageTitle: "Language",
  languageBody: "More languages are coming after beta.",
  languageOnly: "English",
  themeSavedToast: (label: string) => `Theme set to ${label}.`,
  aspectSavedToast: (label: string) => `Default aspect set to ${label}.`,
  styleSavedToast: (label: string) => `Default style set to ${label}.`,
  motionSavedToast: (on: boolean) =>
    on ? "Reduced motion is on." : "Reduced motion follows your device.",
} as const;

export const settingsNotifications = {
  title: "Notifications",
  subline: "How and when we reach out.",
  filmEventsTitle: "Film events",
  filmEventsDescription: "Notifications about your films.",
  securityTitle: "Account security",
  securityDescription: "We always email you about new sign-ins.",
  marketingTitle: "Product news",
  marketingDescription: "Twice a month, max. You can unsubscribe in any email.",
  channelHeader: { event: "Event", email: "Email", push: "Push" },
  pushNotSupported: "Push isn't available in this browser.",
  pushDenied: "Push is blocked. Allow it in your browser settings.",
  pushDeniedHelp: "How to allow push",
  pushPermissionPending: "Asking for permission…",
  events: {
    filmReady: {
      label: "Film ready",
      caption: "When a film finishes shooting.",
    },
    filmError: {
      label: "Film hit a problem",
      caption: "When a film couldn't render.",
    },
    weeklyDigest: {
      label: "Weekly digest",
      caption: "A short summary of films you've shot this week.",
    },
  },
  security: {
    newSignIn: {
      label: "Sign-in from a new device",
      caption: "Always email. Push optional.",
    },
  },
  marketing: {
    productNews: {
      label: "Product news",
      caption: "Occasional notes about new features.",
    },
  },
  toggleAria: (event: string, channel: string, on: boolean) =>
    `${event} ${channel} ${on ? "on" : "off"}`,
  savedToast: (event: string) => `${event} saved.`,
  /** Kept for legacy usage. */
  toggles: {
    filmReady: {
      label: "Film ready",
      caption: "Email me when a film finishes shooting.",
    },
    filmError: {
      label: "Film hit a problem",
      caption: "Email me if a film couldn't render.",
    },
    weeklyDigest: {
      label: "Weekly digest",
      caption: "A short summary of films you've shot this week.",
    },
    marketing: {
      label: "Product news",
      caption: "Occasional notes about new features. No more than once a month.",
    },
  },
  saveChanges: "Save changes",
} as const;

export const settingsDeveloper = {
  title: "Developer",
  subline: "Internal tools. Visible only when developer mode is on.",
  notAvailableTitle: "This page is for staff use.",
  notAvailableBody: "Append ?dev=1 to the URL or tap the version number seven times in About.",
  flagOff: {
    title: "Developer mode is off.",
    body: "Set NEXT_PUBLIC_DEVELOPER_TOOLS=true in your environment to enable.",
  },
  fixtureSection: {
    title: "Fixture mode",
    description: "Override the env flag for this browser. Disabled in production builds.",
    onLabel: "Fixture mode is on",
    offLabel: "Fixture mode is off",
    sourceEnv: "From environment",
    sourceOverride: "From local override",
  },
  flagsSection: {
    title: "Feature flags",
    description: "Reserved for Layer 4.",
    empty: "No feature flags yet.",
  },
  resetSection: {
    title: "Reset all preferences",
    description: "Clears every clevroy:* key from local + session storage.",
    cta: "Reset preferences",
    confirm: {
      title: "Reset everything?",
      body: "We'll wipe local theme, motion, aspect, style, and chat thread caches. You'll be signed in still.",
      cancel: "Keep them",
      confirm: "Reset",
    },
    success: "Local preferences reset.",
  },
  preferencesSection: {
    title: "Resolved preferences",
    description: "What the client believes right now. Useful for bug reports.",
    copyCta: "Copy JSON",
    copied: "Copied.",
  },
  apiSection: {
    title: "Recent provider calls",
    body: "Raw response IDs from the last 50 generation steps. Useful when filing a bug.",
    empty: "No recent activity.",
    columns: {
      timestamp: "Time",
      provider: "Provider",
      model: "Model",
      responseId: "Response ID",
    },
  },
  exportSection: {
    title: "Export your data",
    body: "Download a JSON file with every film, scene, character, and dialogue line tied to your account.",
    cta: "Download JSON",
    pending: "Preparing export…",
  },
} as const;

export const settingsAbout = {
  title: "About",
  subline: "Version and legal.",
  versionLabel: "Version",
  buildLabel: "Build",
  buildTimeLabel: "Built",
  unknownBuild: "Local build",
  unknownTime: "Unknown",
  legalGroup: "Legal",
  links: {
    terms: "Terms of service",
    privacy: "Privacy policy",
    licenses: "Open-source licenses",
    help: "Help & support",
  },
  wordmarkCaption: "Clevroy — your script, on screen, now.",
  acknowledgementsTitle: "Built on",
  acknowledgementsDescription: "We stand on the shoulders of these open-source projects.",
  acknowledgements: [
    "Next.js",
    "React",
    "Tailwind CSS",
    "shadcn/ui",
    "Framer Motion",
    "Zustand",
    "TanStack Query",
    "Vercel AI SDK",
    "Lucide Icons",
  ] as const,
  versionTapHint: "Tap five more times to enable developer mode.",
  versionTapEnabled: "Developer mode enabled.",
} as const;

// ---------------------------------------------------------------------------
// Ghost — AI Twin (Design_System §7.6, EC-N10)
// ---------------------------------------------------------------------------

export const aiTwin = {
  pageTitle: "AI Twin",
  subline: "Train a voice and a face that Clevroy can use in your films.",
  twinUseExplainer: {
    title: "How your twin is used",
    body: "Your twin is only applied when you explicitly pick \"Use my voice\" or \"Use my likeness\" on a new film. We never use it automatically.",
  },
  status: {
    none: "Not trained",
    training: "Training",
    ready: "Ready",
    failed: "Couldn't train",
  },
  voiceCard: {
    title: "Voice twin",
    untrainedBody:
      "Read three short prompts. Takes about two minutes. We'll use the recording to clone your voice for any character you assign to it.",
    trainingBody: "Training your voice. This takes a few minutes.",
    readyBody:
      "Your voice twin is ready to assign to characters in your next film.",
    recordCta: "Record samples",
    rerecordCta: "Record new samples",
    playSample: "Play sample",
    deleteCta: "Delete voice twin",
    deleteDialog: {
      title: "Delete your voice twin?",
      body: "Future films won't be able to use this voice. You can record new samples later.",
    },
  },
  faceCard: {
    title: "Face twin",
    untrainedBody:
      "Upload 5 to 10 photos of yourself. Front-facing, well-lit, the same person in each. We'll build one reference portrait from them.",
    trainingBody: "Training your face. This takes a few minutes.",
    readyBody:
      "Your face twin is ready to assign to characters in your next film.",
    dropZoneLabel: "Drop photos here, or",
    chooseFiles: "Choose files",
    /** Click-fallback label for keyboard / motor accessibility (CC-3). */
    chooseFilesFallback:
      "Drag-and-drop not your thing? Click \"Choose files\" — works the same.",
    photoCounter: (count: number, min: number, max: number) =>
      `${count} of ${min}–${max} photos`,
    train: "Train face twin",
    deleteCta: "Delete face twin",
    deleteDialog: {
      title: "Delete your face twin?",
      body: "Future films won't be able to use this likeness. You can upload new photos later.",
    },
    previewLabel: "Reference portrait",
    constraints: {
      title: "Photo requirements",
      bullets: [
        "5 to 10 photos",
        "The same person in every photo",
        "Face clearly visible, well-lit",
        "Front-facing or three-quarter angle",
      ],
    },
  },
  /** EC-N10 — training failure copy. */
  failure: {
    voiceReason:
      "We couldn't train from these samples. Most often this happens when the audio is too quiet or has background noise.",
    faceReason:
      "We couldn't train from these photos. Most often this happens when the faces aren't clearly visible or are too different from each other.",
    retryWithExisting: "Try again with these photos",
    retryWithExistingVoice: "Try again with these samples",
    startOver: "Start over",
    /** Help modal that unlocks after the third failure. */
    helpModal: {
      face: {
        title: "Why your face twin keeps failing",
        body: "These are the three things our trainer needs from your photos. Try a fresh upload that hits all of them and you should be set.",
        bullets: [
          "Same person in every photo. Photos of two different people will fail.",
          "Faces well-lit and clearly visible. Sunglasses, heavy shadows, or motion blur will fail.",
          "Front-facing or three-quarter angle. Pure profile shots will fail.",
        ],
      },
      voice: {
        title: "Why your voice twin keeps failing",
        body: "These are the things our trainer needs from your recording.",
        bullets: [
          "Quiet room. No traffic, no fans, no music.",
          "Voice clearly audible. No whispering, no shouting.",
          "Each prompt read in full. Skipping cuts off the training.",
        ],
      },
    },
    /** Auto-shown banner when a fresh failure has files preserved on R2. */
    preservedBanner:
      "We're holding your last upload for 24 hours. Try again before then and you won't have to re-upload.",
  },
} as const;

// ---------------------------------------------------------------------------
// Iyo — Sidebar, BottomTabBar, ProfileChip, FilmBalanceBadge,
// InProgressIndicator. "films" surface language per Brand_Guide §5.4.
// EC-N1, EC-N2, EC-N4, EC-G10, CC-1, CC-4 covered here.
// ---------------------------------------------------------------------------

/**
 * Five primary nav links in the locked Design_System §5 order. Sidebar and
 * BottomTabBar share this list so the order can never drift between surfaces.
 */
export const navLinks = {
  home: { label: "Home", href: "/home" },
  projects: { label: "Projects", href: "/projects" },
  // Audit 2026-04-28 #12 — Shape B unifies /home and /create onto one chat
  // surface. The Create slot now reads "New film" and lands on /home so
  // there is no redirect hop. The `create` key is preserved because both
  // Sidebar and BottomTabBar reference it by name.
  create: { label: "New film", href: "/home" },
  // --- Library additions (parallel-safe) ---
  library: { label: "Library", href: "/library" },
  // --- End Library additions ---
  aiTwin: { label: "AI Twin", href: "/ai-twin" },
  settings: { label: "Settings", href: "/settings" },
} as const;

export type NavLinkKey = keyof typeof navLinks;

export const sidebar = {
  /** Wordmark return-to-root link, screen-reader name. The visible mark is
   * decorative type set in Inter Display Semibold at the call site. */
  wordmarkAria: "Clevroy — back to Home",
  /** Tooltip shown on the collapsed-rail toggle. */
  toggleAria: "Toggle sidebar",
  /** A.1 — Recent films collapsible group label (sidebar-09 recipe). */
  recentLabel: "Recent",
  /** A.1 — screen-reader name for the unseen-film dot beside a recent row. */
  recentNewAria: "New",
  /** A.2 — Resources group label and item labels. Discord deferred until
   *  a real one exists; an empty link is worse than no link. */
  resourcesLabel: "Resources",
  feedbackLabel: "Feedback",
  documentationLabel: "Documentation",
  whatsNewLabel: "What's new",
  shortcutsLabel: "Keyboard shortcuts",
  /** TODO(product): swap to the real feedback address once one is confirmed. */
  feedbackHref: "mailto:feedback@clevroy.com?subject=Clevroy%20feedback",
  documentationHref: "/docs",
  whatsNewHref: "/changelog",
  shortcutsHref: "/docs/shortcuts",
  /** Primary-nav additions sitting between the canonical 4-slot list. They
   *  are sidebar-only — BottomTabBar still ships the locked 5-slot order. */
  templatesLabel: "Templates",
  templatesHref: "/templates",
  libraryLabel: "Library",
  libraryHref: "/library",
} as const;

export const bottomTabBar = {
  ariaLabel: "Primary",
  /** EC-N1 — first-three-opens onboarding hint anchored under the center
   * Create button. Plain language; never marketing copy. */
  firstOpenHint: "Tap Create to start a film",
  /** Aria-label for the elevated Create button. */
  createAria: "Start your film",
} as const;

export const profileChip = {
  /** Trigger aria — visible label is the user's first name; this is the
   * accessible description that screen readers read. */
  triggerAria: (firstName: string | null | undefined) =>
    firstName && firstName.trim().length > 0
      ? `${firstName.trim()} — account menu`
      : "Account menu",
  signOut: "Sign out",
  help: "Help",
  themeLabel: "Theme",
  /** CC-1 surfaces the choice rather than silently following system. */
  themeOptions: {
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  /** EC-N4 — confirmation when signing out during active generation. The
   * verbs come from confirmVerbPairs.signOutDuringGeneration. */
  signOutDuringGenerationTitle: "Sign out?",
  signOutDuringGenerationDescription:
    "Your film will keep shooting — you'll see it the next time you sign in.",
} as const;

export const filmBalanceBadge = {
  /** "N films left" — Brand_Guide §5.4 surface language. `n` is already an
   * integer (Math.floor of the NUMERIC(8,2) string at the call site). */
  filmsLeft: (n: number) => (n === 1 ? "1 film left" : `${n} films left`),
  /** EC-N2 — when the balance reaches 0, the badge becomes a primary nudge. */
  buyMoreFilms: "Buy more films",
  /** Screen-reader label that disambiguates the click target. */
  buyMoreAria: "Out of films. Buy more films.",
} as const;

export const inProgressIndicator = {
  /** CC-5 — visual red dot must carry an aria-label. */
  ariaLabel: "A film is being shot.",
} as const;

// ---------------------------------------------------------------------------
// Kaiser — Results page, Reshoot flow, Take it home (exports).
// Surface language per Brand_Guide §5.3 / §5.4: "Reshoot this scene",
// "Take it home", "Final cut". Error voice per §6: name the thing that
// didn't render, never "Oops" / "Something went wrong".
// EC-G8 (rapid-click reshoot) + EC-G4 (single-scene generation failure).
// ---------------------------------------------------------------------------

/** Zone 1 — hero player + film metadata row. Design_System §7.5. */
export const resultsHero = {
  /** Editable title input ARIA label. */
  titleAriaLabel: "Film title",
  /** Save title on blur — disabled while the rename mutation is in flight. */
  titleSaving: "Saving…",
  /** Format strings the call site composes. */
  scenes: (n: number) => (n === 1 ? "1 scene" : `${n} scenes`),
  durationLabel: "Duration",
  createdLabel: "Created",
  /** Player loading shim — never the word "Loading". */
  playerLoading: "Cueing the reel…",
  /** Player fell back when the signed URL couldn't be resolved. */
  playerUnavailable: "The final cut isn't ready to play.",
  /** Share is a v1.1 surface — disabled tooltip per Brand_Guide §6.3
   *  (no "Coming soon"-style language). */
  shareLabel: "Share",
  shareTooltip: "Sharing is in the next reel.",
} as const;

/** Zone 1 — Take-It-Home (exports) menu. */
export const takeItHome = {
  trigger: "Take it home",
  /** Items render labels + a one-line subline. */
  items: {
    mp4: { label: "Video", subline: "MP4 — full film" },
    pdf: { label: "Book", subline: "PDF — read your film" },
    zip: { label: "Website", subline: "ZIP — share as a page" },
  },
  /** Shown while the export task is queued/processing. */
  preparing: (format: TakeItHomeFormatLabel) =>
    `Preparing your ${format}.`,
  /** Sonner toast on success — single line per Brand_Guide §6.2 (success
   *  states are understated). */
  ready: (format: TakeItHomeFormatLabel) => ({
    title: `Your ${format} is ready.`,
    body: "Click the link to take it home.",
    action: "Download",
  }),
  /** Sonner toast on failure — names the format and offers a try-again. */
  failed: (format: TakeItHomeFormatLabel) => ({
    title: `Your ${format} didn't finish.`,
    body: "Try again from the Take it home menu.",
  }),
} as const;

export type TakeItHomeFormatLabel = "video" | "book" | "website";

/** Zone 2 — three-dot menu items per scene. */
export const sceneActions = {
  triggerAriaLabel: (sceneNumber: number) => `Scene ${sceneNumber} actions`,
  reshoot: "Reshoot this scene",
  viewCharacters: "View characters",
  exportScene: "Export scene",
} as const;

/** Reshoot confirmation — locked copy from Design_System §7.5 + EC-G8. */
export const reshootConfirm = {
  title: "Reshoot this scene?",
  /** "0.2 films" reads fine in this context per Brand_Guide §5.3 (the
   *  exception listed there for scene-regen cost). */
  body: "It will use 0.2 films from your balance.",
} as const;

/** EC-G4 — error variant on the Results page when one scene didn't render.
 *  The reshoot is FREE (`reason: "generation_failure"`). */
export const errorRecovery = {
  banner: {
    title: (sceneNumber: number) =>
      `We missed a shot. Scene ${sceneNumber} didn't render.`,
    body: "You can reshoot it without losing progress, or finish without it.",
  },
  primary: (sceneNumber: number) => `Reshoot scene ${sceneNumber}`,
  /** Free reshoot indicator next to the primary button. */
  freeIndicator: "No film cost",
  secondary: "Continue without it",
  /** Confirmation when the user picks the "continue without it" path. */
  continueConfirm: {
    title: "Finish without this scene?",
    body: "Your film will be marked Incomplete and a partial refund returned to your balance.",
    cancel: "Keep trying",
    confirm: "Finish without it",
  },
} as const;

/** Zone 3 — tab labels (Design_System §7.5). */
export const resultsTabs = {
  script: "Script",
  characters: "Characters",
  voiceMusic: "Voice & Music",
  metadata: "Metadata",
  /** Per-tab empty fallbacks (used when a section returns no data). */
  scriptEmpty: "The script wasn't saved with this film.",
  charactersEmpty: "No character portraits to show yet.",
  voiceMusicEmpty: "Voice and score details aren't available for this film.",
  metadataEmpty: "Generation details aren't available for this film.",
} as const;

/** Zone 3 — Voice & Music tab labels. */
export const voiceMusicLabels = {
  voicesHeader: "Voices",
  scoreHeader: "Score",
  voiceTwinTag: "Your voice twin",
  scoreStyle: (preset: string) => `${preset} score`,
  durationLabel: (seconds: number) => `${seconds}s`,
} as const;

/** Zone 3 — Metadata tab labels. */
export const metadataLabels = {
  generatedHeader: "Generated",
  startedAt: "Started",
  completedAt: "Completed",
  styleLabel: "Style",
  aspectLabel: "Aspect ratio",
  costHeader: "Film cost",
  totalLabel: "Total",
  callLogHeader: "Provider call log",
  callLogToggle: { open: "Show calls", close: "Hide calls" },
  callLogColumns: {
    occurredAt: "When",
    provider: "Provider",
    model: "Model",
    latency: "Latency",
    cost: "Cost",
    status: "Status",
  },
  callLogStatus: {
    success: "OK",
    failure: "Failed",
    retry: "Retried",
  },
  callLogEmpty: "No provider calls were logged for this film.",
} as const;

/** Result-state-specific empty / error fallbacks rendered on /films/[id]. */
export const resultsState = {
  loading: "Cueing your film…",
  notReady: {
    title: "This film isn't ready to watch yet.",
    body: "It's still being shot. We'll take you back when it's done.",
  },
} as const;


// ---------------------------------------------------------------------------
// Fantem — Create page (input + generation phases) and CenterStage.
// Surface language per Brand_Guide §5.3–§5.4. Phase narration headlines come
// from `phaseNarration` above; the strings below are page chrome, CTAs,
// modals, and slow-phase / connection sublines specific to /create.
// ---------------------------------------------------------------------------

export const createPage = {
  /** Page title. Brand_Guide §5.3 spine CTA. */
  pageTitle: "Start your film",
  /** One-line subtitle under the H1. Sets expectation in plain language. */
  subline: "Paste a script. Pick a look. We'll start shooting.",

  /** Script textarea placeholder — verbatim from Design_System §7.4. */
  textareaPlaceholder:
    "Paste a script or tell us your story. A paragraph, a page, or a full screenplay — we'll read it and figure out the scenes.",
  /** Aria-label for the script textarea (visually labeled by the H1 instead). */
  textareaAriaLabel: "Your script",
  /** Inline character-count helper; shown only after typing begins. */
  charCount: (current: number, min: number) =>
    current < min
      ? `${current} / ${min} characters to start.`
      : `${current} characters.`,
  /** EC-N5 — autosaved-draft restored notice when the user returns post-sign-in. */
  draftRestored: "Picked up your draft.",

  /** Style preset row. Design_System §7.4 lists examples — these four cover
   * the common requests; a fifth slot is held for "Stop-Motion" if added. */
  styleSectionTitle: "Style",
  styleSectionHelp: "How should it look?",

  /** Subline above the CTA when balance ≥ 1. The film count is interpolated. */
  filmCostSubline: (filmsLeft: string) =>
    `This will use 1 film from your balance. You have ${filmsLeft} films left.`,
  /** EC-N2 — subline alternate when balance is 0. */
  outOfFilmsSubline: "You're out of films. Grab more to start shooting.",

  /** Primary CTA when balance allows starting. */
  startCta: "Start your film",
  /** EC-N2 — CTA flips to a purchase nudge while letting the user keep typing. */
  buyMoreCta: "Buy more films to start",

  /** Aria-label fallback for the back arrow on mobile generation. */
  backToInput: "Back",

  /**
   * Layout_Enhancements A.10 — live cost-preview chip rendered above the
   * primary CTA on the input phase. Bound to the balance store; copy never
   * casts NUMERIC(8,2) strings to float at the leaf (Brand_Guide §5.3 +
   * Frontend_Bootstrap §1).
   */
  costPreview: {
    /** Pre-start cost. 1 film per new video at the current credit model
     * (Frontend_Bootstrap §7.1). */
    label: "≈ 1 film for this video",
    /** Aria-label spelled out for screen readers — the "≈" symbol reads as
     * gibberish on most readers. */
    ariaLabel: "Approximately one film for this video.",
    /** Suffix appended after the chip when films-left is non-zero. The
     * caller passes the NUMERIC(8,2) string verbatim — never coerce. */
    balanceSuffix: (films: string) => `· ${films} left`,
    /** Aria full-sentence alternative for the suffix. */
    balanceAriaLabel: (films: string) => `${films} films left in your balance.`,
  },
} as const;

/**
 * Style presets surfaced in the Create input row. Order is the order shown.
 * Each preset's `id` is sent to the backend as `style_preset` (Stratum's
 * CreateFilmRequest). Captions are short — they go below the preset name in
 * the card and must not exceed two short clauses.
 */
export const stylePresets = [
  {
    id: "cinematic",
    label: "Cinematic",
    caption: "Filmic light, wide frames, warm grade.",
  },
  {
    id: "animated",
    label: "Animated",
    caption: "Hand-drawn warmth, soft outlines.",
  },
  {
    id: "documentary",
    label: "Documentary",
    caption: "Natural light, observational framing.",
  },
  {
    id: "noir",
    label: "Noir",
    caption: "High contrast, deep shadows, monochrome lean.",
  },
] as const;

export type StylePresetId = (typeof stylePresets)[number]["id"];

export const centerStage = {
  /** Aria region label for the center stage panel itself (Design_System §8). */
  ariaRegionLabel: "Generation stage",

  /** Scene caption shown in the bottom-left of scene_images_pending. */
  sceneCaption: (current: number, total: number) =>
    `[${pad2(current)} / ${pad2(total)}]`,

  /** Voice-synthesis subtitle prefix when no character name is available. */
  voiceLineSubtitleFallback: "Recording dialogue.",

  /** Music-composition center label, when no style is provided. */
  musicComposingLabel: "Composing your soundtrack.",

  /** Complete-state center label / aria-name of the play button. */
  playFilmAria: "Play film",
  playFilmCaption: "Your film is ready to watch.",

  /** Error-state CTAs. Free reshoot per EC-G4. */
  reshootSceneCta: "Reshoot scene",
  continueWithoutCta: "Continue without it",
} as const;

export const cancelGeneration = {
  /** Visible link copy in the bottom-right of the panel. Verbs are plain
   * per Brand_Guide §5.4. */
  link: "Cancel generation",
  /** Modal title. Verbs come from confirmVerbPairs.cancelGeneration. */
  dialogTitle: "Stop this generation?",
  dialogBody: "You'll get back any unused films.",
  /** Interstitial state shown while the cancel mutation is in flight (≤5s). */
  stopping: "Stopping…",
  /** Mobile cancel-bar copy that replaces the bottom tab bar during gen. */
  mobileBarPrefix: "Running in background",
  mobileBarCancel: "Cancel generation",
} as const;

export const connectionBanner = {
  /** EC-G2 — text shown while the Realtime socket is reconnecting. */
  reconnecting: "Lost connection. Reconnecting…",
  /** EC-G2 — text shown briefly (1s) after reconnect, then fades. */
  reconnected: "Reconnected.",
} as const;

export const slowPhase = {
  /** EC-G9 — appended below the phase narration subline at p95. */
  p95: "Taking a little longer than usual. Still shooting.",
  /** EC-G9 — at p99. */
  p99: "This is running slow. You can wait or cancel — your script is saved either way.",
  /** Activity feed entry inserted when the backend emits the slow-phase event. */
  activityP95: "Taking a little longer than usual.",
  activityP99: "Still running slow.",
} as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// ---------------------------------------------------------------------------
// Library — /library/* (parallel-safe section)
// ---------------------------------------------------------------------------

export const library = {
  pageTitle: "Library",
  subline: "Your saved ingredients.",
  tabs: {
    templates: "Saved templates",
    characters: "Characters",
    styles: "Styles",
    references: "References",
    drafts: "Drafts",
  },
  tabsAria: "Library sections",
  templates: {
    empty: "Save templates from Templates to find them here.",
    browseLink: "Browse templates",
    searchPlaceholder: "Search saved templates",
    placeholderTitle: (id: string) => `Saved template · ${id}`,
    remove: "Remove",
    capWarning: "You hit the saved-templates cap. Oldest was removed.",
  },
  characters: {
    primaryName: "You",
    primaryHelper: (voice: string, face: string) =>
      `Voice: ${voice} · Face: ${face}`,
    primaryEdit: "Edit your AI Twin",
    addNew: "+ New character",
    addNewAria: "Create a new character",
    empty: "Build your first recurring character.",
    nameLabel: "Name",
    nameHelper: "How you'll refer to this character.",
    namePlaceholder: "Detective Reyes",
    faceSource: "Face",
    faceUseTwin: "Use my AI Twin face",
    faceUpload: "Upload new",
    voiceSource: "Voice",
    voiceUseTwin: "Use my AI Twin voice",
    voiceRecord: "Record new",
    voiceRecordPending: "Recording (Layer 5)",
    notesLabel: "Style notes",
    notesHelper: "Describe how this character looks and sounds.",
    notesPlaceholder: "Trench coat, mid-30s, soft-spoken, smokes between scenes.",
    save: "Save character",
    cancel: "Cancel",
    useInFilm: "Use in next film",
    rename: "Rename",
    delete: "Delete",
    useInFilmToast: (name: string) => `${name} ready for your next film.`,
    deleteConfirm: {
      title: (name: string) => `Delete ${name}?`,
      body: "We'll remove this character from your library.",
    },
    sheetTitle: "New character",
    sheetDescription: "Saved here so you can use them across films.",
    nameTooShort: "Name must be 2 to 32 characters.",
    notesCounter: (n: number) => `${n} / 200`,
  },
  styles: {
    addNew: "+ New style",
    addNewAria: "Create a new style",
    empty: "Build a style with prompt fragments. Use it across your films.",
    nameLabel: "Name",
    namePlaceholder: "Sun-bleached western",
    basedOnLabel: "Based on",
    basedOnCustom: "Custom",
    fragmentsLabel: "Prompt fragments",
    fragmentsPlaceholder: "warm grade, low contrast, 35mm film…",
    fragmentsHelper: "Press Enter to add each fragment.",
    samplePromptLabel: "Sample prompt",
    samplePromptEmpty: "Add fragments to preview the prompt.",
    save: "Save style",
    cancel: "Cancel",
    useAsDefault: "Use as default",
    duplicate: "Duplicate",
    rename: "Rename",
    delete: "Delete",
    useAsDefaultToast: (name: string) => `Default style set to ${name}.`,
    deleteConfirm: {
      title: (name: string) => `Delete ${name}?`,
      body: "We'll remove this style from your library.",
    },
    basedOnCaption: (basedOn: string) => `Based on ${basedOn}`,
    sheetTitle: "New style",
    sheetDescription: "Build it once. Use it across films.",
  },
  references: {
    addNew: "+ Upload",
    empty: "Drop images here for the AI to see.",
    dropZoneIdle: "Drag images here, or click to upload.",
    use: "Use in next film",
    rename: "Rename",
    delete: "Delete",
    view: "View",
    sizeWarn: "Skipped — over 5MB.",
    typeWarn: "Skipped — only images.",
    capWarn: "You hit the references cap. Oldest was removed.",
    addedToast: (n: number) =>
      n === 1 ? "Added to your references." : `Added ${n} references.`,
    titlePrompt: "Rename reference",
  },
  drafts: {
    empty: "Save drafts from Home when you're not ready to mint yet.",
    homeLink: "Go to Home",
    open: "Open",
    delete: "Delete",
    rename: "Rename",
    lastEdited: (rel: string) => `Last edited ${rel}`,
    saveAsDraft: "Save as draft",
    savedToast: "Saved to drafts.",
    capWarn: "You hit the drafts cap. Oldest was removed.",
    deleteConfirm: {
      title: "Delete this draft?",
      body: "We'll remove it from your library. You can save it again from Home.",
    },
    untitledFallback: "Untitled draft",
    openToast: "Draft opened in Home.",
  },
  /** Sonner toast for the templates tab when removing un-saves the entry. */
  templateRemovedToast: "Removed from saved templates.",
} as const;

