"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  Coffee,
  Compass,
  CornerDownLeft,
  Crown,
  Ghost,
  Gift,
  Heart,
  Mic,
  Mountain,
  Music,
  Palette,
  Paperclip,
  Rocket,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputMessage,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  compactActivities,
  MessageRenderer,
} from "@/components/chat/messages";
import { useInProgressFilm, useRecentFilms } from "@/hooks/use-films";
import { useDraftText } from "@/hooks/use-draft-text";
import { useHydrated } from "@/hooks/use-hydrated";
import { usePhaseWalker } from "@/hooks/use-phase-walker";
import type { FileUIPart } from "ai";
import { useMessages } from "@/stores/chat-store";
import {
  ASPECTS,
  STYLE_PRESETS,
  useAspect,
  useSetAspect,
  useSetStyle,
  useStyle,
  type Aspect,
  type StylePreset,
} from "@/stores/create-options-store";
import { home } from "@/lib/copy";
import { cn } from "@/lib/utils";

// Re-export so any external consumer that previously imported these from
// ChatSurface keeps compiling. Source of truth is now the store.
export { ASPECTS, STYLE_PRESETS };
export type { Aspect, StylePreset };

// ---------------------------------------------------------------------------
// Prompt categories — 12 categories, 3 starter prompts each. Selecting a
// category chip filters the visible cards to that category's three. No
// rotation, no Surprise me — the user picks the genre and sees focused
// suggestions.
// ---------------------------------------------------------------------------

type CategoryKey =
  | "Noir"
  | "Romance"
  | "Horror"
  | "Sci-Fi"
  | "Documentary"
  | "Animated"
  | "Adventure"
  | "Drama"
  | "Indie"
  | "Comedy"
  | "Period"
  | "Birthday";

type Category = {
  key: CategoryKey;
  icon: LucideIcon;
  /** Per-category tint applied to the slug + icon row of each card. Body
   *  text stays neutral so cards still read as one family. */
  accent: string;
  prompts: ReadonlyArray<string>;
};

const PROMPT_CATEGORIES: ReadonlyArray<Category> = [
  {
    key: "Noir",
    icon: Search,
    accent: "text-slate-500 dark:text-slate-400",
    prompts: [
      "A 90-second noir about a detective who finds a film camera in a junkyard.",
      "Late-night diner. Two strangers. One of them is lying about a missing brother.",
      "A jazz pianist gets a phone call she's been dreading for ten years.",
    ],
  },
  {
    key: "Romance",
    icon: Coffee,
    accent: "text-amber-600 dark:text-amber-400",
    prompts: [
      "Coffee-shop romance, late autumn, almost no dialogue.",
      "Two pen-pals meet for the first time at a train station — neither has a phone.",
      "A florist and the regular who only ever buys one stem a week.",
    ],
  },
  {
    key: "Horror",
    icon: Ghost,
    accent: "text-destructive/80",
    prompts: [
      "Trailer for a fake horror movie about a haunted thrift store.",
      "A house-sitter notices the family photos rearranging themselves.",
      "Three friends stay one extra night at the cabin. They shouldn't have.",
    ],
  },
  {
    key: "Sci-Fi",
    icon: Rocket,
    accent: "text-sky-600 dark:text-sky-400",
    prompts: [
      "An astronaut gets a postcard from Earth.",
      "A repair tech on a deep-space station starts receiving messages from herself.",
      "First contact, told entirely from the perspective of a translator.",
    ],
  },
  {
    key: "Documentary",
    icon: Camera,
    accent: "text-teal-600 dark:text-teal-400",
    prompts: [
      "Documentary portrait of a 90-year-old surfer.",
      "A neighborhood bakery's last week before the building is demolished.",
      "The night-shift workers at a 24-hour laundromat, in their own words.",
    ],
  },
  {
    key: "Animated",
    icon: Palette,
    accent: "text-violet-600 dark:text-violet-400",
    prompts: [
      "Animated short about a paper plane that finds its way home.",
      "A lighthouse and the storm that visits it every autumn.",
      "A small robot learning to draw the moon.",
    ],
  },
  {
    key: "Adventure",
    icon: Mountain,
    accent: "text-emerald-600 dark:text-emerald-400",
    prompts: [
      "Mountain expedition told in three takes, cut to silence.",
      "A solo sailor crosses a strait that hasn't been crossed in a century.",
      "Two siblings hike a forgotten trail their grandfather mapped by hand.",
    ],
  },
  {
    key: "Drama",
    icon: Music,
    accent: "text-indigo-600 dark:text-indigo-400",
    prompts: [
      "A piano teacher meets her last student of the day.",
      "A father and son repaint the family house the week before it's sold.",
      "Two old friends sit on a porch and finally say the thing.",
    ],
  },
  {
    key: "Indie",
    icon: Compass,
    accent: "text-stone-500 dark:text-stone-400",
    prompts: [
      "Teenager bikes home through fog after a bad night.",
      "A barista writes a different name on every cup for a week.",
      "Two roommates split the last week of a lease they can't afford.",
    ],
  },
  {
    key: "Comedy",
    icon: Heart,
    accent: "text-pink-500 dark:text-pink-400",
    prompts: [
      "Birthday party from the family dog's point of view.",
      "A wedding photographer who can't stop crying at every wedding.",
      "Two coworkers compete to win the office plant they both forgot to water.",
    ],
  },
  {
    key: "Period",
    icon: Crown,
    accent: "text-yellow-700 dark:text-yellow-400",
    prompts: [
      "Period piece about a forgotten queen and her cartographer.",
      "A 1920s switchboard operator listens to one call too many.",
      "A traveling photographer in 1880s Montana takes a portrait that ruins him.",
    ],
  },
  {
    key: "Birthday",
    icon: Gift,
    accent: "text-rose-500 dark:text-rose-400",
    prompts: [
      "Birthday message for Mom set to her favorite song.",
      "A surprise birthday for someone who hates surprises.",
      "Five people record one line each for a friend turning forty.",
    ],
  },
];

function findCategory(key: CategoryKey): Category {
  return PROMPT_CATEGORIES.find((c) => c.key === key) ?? PROMPT_CATEGORIES[0]!;
}

// ---------------------------------------------------------------------------
// Aspect ratio + style preset state lives in
// `src/stores/create-options-store.ts` so the choice persists across
// navigation and reloads. Types are re-exported above for external imports.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Time + relative helpers
// ---------------------------------------------------------------------------

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < hour) return "just now";
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function useCurrentHour(): number {
  const [hour] = React.useState(() => new Date().getHours());
  return hour;
}

// Once-per-session letter-by-letter type-on for the welcome line.
function useTypeOn(text: string): string {
  const reduceMotion = useReducedMotion();
  const STORAGE_KEY = "clevroy:welcome-typed";
  const [shown, setShown] = React.useState<string>(text);
  const playedRef = React.useRef(false);

  React.useEffect(() => {
    if (reduceMotion) return;
    if (playedRef.current) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
    playedRef.current = true;
    window.sessionStorage.setItem(STORAGE_KEY, "1");

    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [text, reduceMotion]);

  return shown;
}

function useIdle(thresholdMs: number): boolean {
  const { textInput } = usePromptInputController();
  const [idle, setIdle] = React.useState(false);

  React.useEffect(() => {
    if (textInput.value.length > 0) {
      setIdle(false);
      return;
    }
    setIdle(false);
    const id = window.setTimeout(() => setIdle(true), thresholdMs);
    return () => window.clearTimeout(id);
  }, [textInput.value, thresholdMs]);

  return idle;
}

// ---------------------------------------------------------------------------
// Welcome block — time-of-day line, continuity-aware swap, type-on, idle pulse.
// ---------------------------------------------------------------------------

function CallSheetMeta() {
  const { data } = useRecentFilms(1);
  const recent = data?.[0];
  if (!recent) return null;
  const ts = recent.completed_at ?? recent.created_at;
  const rel = formatRelative(ts);
  if (!rel) return null;
  return (
    <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {home.callSheetMeta(recent.title, rel)}
    </p>
  );
}

function WelcomeBlock({
  firstName,
}: {
  firstName: string | null | undefined;
}) {
  const hour = useCurrentHour();
  const { textInput } = usePromptInputController();
  const dimmed = textInput.value.trim().length > 0;
  const idle = useIdle(30_000);
  const reduceMotion = useReducedMotion();

  const inProgress = useInProgressFilm();
  const active = inProgress.data;

  const baseLine = active
    ? firstName
      ? `Where we left off, ${firstName}?`
      : "Where we left off?"
    : home.chatWelcomeLineForHour(firstName ?? null, hour);

  const typed = useTypeOn(baseLine);

  return (
    <motion.div
      animate={
        idle && !reduceMotion ? { scale: [1, 1.012, 1] } : { scale: 1 }
      }
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className={cn(
        "flex flex-col items-center gap-2 transition-opacity duration-200 ease-out",
        dimmed ? "opacity-50" : "opacity-100",
      )}
    >
      <p className="min-h-[2.25rem] text-balance text-center text-phase text-foreground">
        {typed}
      </p>
      {active ? (
        <Link
          href={`/films/${active.id}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Take me there
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
      {idle ? (
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          Take your time.
        </p>
      ) : (
        <CallSheetMeta />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Aspect toggle (segmented pill) — sits in the input footer.
// ---------------------------------------------------------------------------

function AspectToggle({
  value,
  onChange,
}: {
  value: Aspect;
  onChange: (next: Aspect) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Aspect ratio"
      className="inline-flex items-center rounded-full border border-border bg-background p-0.5"
    >
      {ASPECTS.map((a) => {
        const active = a === value;
        return (
          <button
            key={a}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(a)}
            className={cn(
              "rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roll button — submit pill with a Cmd-Enter tooltip. Replaces the inline
// "⌘↵ to roll" caption that used to clutter the footer; the same hint is
// now surfaced on hover/focus.
// ---------------------------------------------------------------------------

function RollButton({ disabled }: { disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="submit"
          disabled={disabled}
          className={cn(
            // 44px touch height per CLAUDE.md accessibility constraint;
            // trims to 36px on hover-capable pointers so it doesn't
            // dominate the desktop footer. Width is fluid via px-4 so the
            // label has room.
            "inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground",
            "[@media(hover:hover)]:h-9",
            "transition-colors hover:bg-primary/90",
            "disabled:pointer-events-none disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <span>Roll</span>
          <CornerDownLeft className="size-3" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
          ⌘↵ to roll
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// AttachmentButton — opens the file picker via the AI Elements attachments
// context. The dropzone + File state are owned by <PromptInputProvider>; this
// is a slim icon trigger so the user has a discoverable affordance in the
// footer rather than relying on paste-to-attach alone.
// ---------------------------------------------------------------------------

function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Attach a file"
          disabled={disabled}
          onClick={() => attachments.openFileDialog()}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full border border-border bg-background",
            "text-muted-foreground transition-colors",
            "hover:border-primary/30 hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <Paperclip className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">Attach a file</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// AttachmentChips — shows the current attachment list above the textarea
// (rendered inside <PromptInputHeader>). Each chip shows the filename and
// a remove button. Image attachments render as a small thumbnail; everything
// else falls back to a generic file glyph.
// ---------------------------------------------------------------------------

function AttachmentChips() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {attachments.files.map((file) => {
        const isImage = file.mediaType?.startsWith("image/") === true;
        return (
          <span
            key={file.id}
            className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pl-1 pr-1.5 text-xs text-foreground"
          >
            {isImage && file.url ? (
              <img
                src={file.url}
                alt=""
                className="size-5 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <Paperclip className="size-3" strokeWidth={1.75} />
              </span>
            )}
            <span className="truncate font-mono text-[11px]">
              {file.filename ?? "file"}
            </span>
            <button
              type="button"
              aria-label={`Remove ${file.filename ?? "file"}`}
              onClick={() => attachments.remove(file.id)}
              className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" strokeWidth={2} aria-hidden="true" />
            </button>
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voice input — Web Speech API (SpeechRecognition / webkitSpeechRecognition).
// While listening, the button is in primary-soft state and pulses (motion-safe).
// On every result the running transcript is appended to the textarea via
// `usePromptInputController().textInput.setInput(...)`. Stops on second click,
// on submit, or when the API emits `end`. Falls back to disabled+tooltip on
// browsers without speech-recognition support (Firefox, etc.).
// ---------------------------------------------------------------------------

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function VoiceInputButton({ disabled }: { disabled?: boolean }) {
  const { textInput } = usePromptInputController();
  const [supported, setSupported] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  // Snapshot of the textarea value at the moment recording starts. The live
  // transcript is appended to this baseline so each result swap doesn't wipe
  // text the user typed before pressing the mic.
  const baselineRef = React.useRef<string>("");

  React.useEffect(() => {
    setSupported(getSpeechRecognitionCtor() != null);
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Recognition was already torn down — silent.
      }
    };
  }, []);

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang =
      typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    baselineRef.current = textInput.value;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const alt = result?.[0];
        if (!alt) continue;
        // The Web Speech result objects have an `isFinal` flag, which is not
        // typed in our minimal `SpeechRecognitionLike` shape — treat the alt's
        // transcript as final via a runtime cast.
        const isFinal = (result as unknown as { isFinal?: boolean }).isFinal === true;
        if (isFinal) final += alt.transcript;
        else interim += alt.transcript;
      }
      const baseline = baselineRef.current;
      const joiner = baseline.length > 0 && !baseline.endsWith(" ") ? " " : "";
      textInput.setInput(`${baseline}${joiner}${final}${interim}`.trimStart());
      // Promote final segments into the new baseline so the next interim
      // result doesn't double-print them.
      if (final) {
        baselineRef.current = `${baseline}${joiner}${final}`;
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      // Some browsers throw if start() is called twice in a row — silent.
    }
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition already stopped — silent.
    }
    setListening(false);
  }

  function toggle() {
    if (listening) stopListening();
    else startListening();
  }

  const tooltip = !supported
    ? "Voice input isn't available in this browser"
    : listening
      ? "Stop recording"
      : "Voice input";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={tooltip}
          aria-pressed={listening}
          disabled={disabled || !supported}
          onClick={toggle}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            listening
              ? "border-primary bg-primary-soft text-primary motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]"
              : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
          )}
        >
          <Mic className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// SubmitConsumer — the actual <PromptInput> with all the chrome.
// ---------------------------------------------------------------------------

/** Submit payload from the chat input. Files are blob-URL-backed and don't
 *  survive a reload — Layer 5 will swap them for R2-signed URLs that do. */
export type ChatSubmit = {
  text: string;
  files: ReadonlyArray<FileUIPart>;
};

function SubmitConsumer({
  onSubmit,
  disabled,
  showSlate,
  aspect,
  onAspectChange,
  draftScope,
}: {
  onSubmit?: (payload: ChatSubmit) => void;
  disabled?: boolean;
  showSlate?: boolean;
  aspect: Aspect;
  onAspectChange: (next: Aspect) => void;
  /** sessionStorage scope for textarea draft autosave. `"home"` for empty
   *  mode, `"thread:<filmId>"` for thread mode. Drafts don't leak across
   *  scopes so a film-specific refinement stays attached to its film. */
  draftScope?: string | null;
}) {
  const { textInput, attachments } = usePromptInputController();
  const draft = useDraftText(draftScope ?? null);

  // On mount (and on scope change), push the persisted draft back into the
  // textarea. The textarea owns the live value; the hook owns persistence.
  const restoreAppliedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (draft.restored == null) return;
    if (restoreAppliedRef.current === draft.restored) return;
    restoreAppliedRef.current = draft.restored;
    textInput.setInput(draft.restored);
  }, [draft.restored, textInput]);

  // Funnel every keystroke into the autosave loop. The hook batches writes
  // every 2s, so this is cheap.
  React.useEffect(() => {
    draft.save(textInput.value);
  }, [textInput.value, draft]);

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();
    if (!text || disabled) return;
    onSubmit?.({ text, files: message.files });
    textInput.clear();
    attachments.clear();
    draft.clear();
  }

  return (
    <PromptInput
      onSubmit={handleSubmit}
      accept="image/*,application/pdf,text/plain"
      maxFiles={6}
      maxFileSize={10 * 1024 * 1024}
      className={cn(
        // Item 2 + 5: tokenize the input to match the prompt cards exactly,
        // and lift on focus so the surface acknowledges the click.
        "rounded-2xl border-border bg-card shadow-sm transition-all duration-200",
        "focus-within:border-primary/20 focus-within:shadow-md",
      )}
    >
      {showSlate ? (
        <PromptInputHeader>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Take 1
          </span>
          <AttachmentChips />
        </PromptInputHeader>
      ) : (
        <PromptInputHeader>
          <AttachmentChips />
        </PromptInputHeader>
      )}
      <PromptInputBody>
        <PromptInputTextarea
          placeholder="Tell me a log line. A character, a goal, a problem."
          aria-label="Tell me a log line"
          disabled={disabled}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools className="flex-wrap items-center gap-1.5">
          <AttachmentButton disabled={disabled} />
          <VoiceInputButton disabled={disabled} />
          <AspectToggle value={aspect} onChange={onAspectChange} />
        </PromptInputTools>
        <div className="flex items-center gap-2">
          <RollButton disabled={disabled} />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );
}

// ---------------------------------------------------------------------------
// Style chips (between input and suggestions). Pre-flavors the prompt.
// ---------------------------------------------------------------------------

function StyleChips({
  value,
  onChange,
}: {
  value: StylePreset | null;
  onChange: (next: StylePreset | null) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Style preset"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {STYLE_PRESETS.map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storyboard suggestions — chip row + filtered cards. The user picks a film
// type; three focused prompts for that type appear below. No rotation, no
// Surprise me. Empty state is just the chips — cards are opt-in so the
// surface starts quiet.
// ---------------------------------------------------------------------------

function StoryboardSuggestions() {
  const { textInput } = usePromptInputController();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = React.useState<CategoryKey | null>(null);

  // When the user starts typing, hide both chips and cards — the suggestions
  // are an empty-state affordance, not running chrome.
  if (textInput.value.trim().length > 0) return null;

  const cards = active ? findCategory(active).prompts : [];

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Film categories"
        className="flex flex-wrap items-center justify-center gap-1.5"
      >
        {PROMPT_CATEGORIES.map(({ key, icon: Icon, accent }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(isActive ? null : key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                "text-[11px] font-medium tracking-wide transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-3 shrink-0", !isActive && accent)}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {key}
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {active ? (
          <motion.div
            key={active}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {cards.map((prompt) => {
              const { icon: Icon, accent } = findCategory(active);
              return (
                <Card
                  key={prompt}
                  role="button"
                  tabIndex={0}
                  onClick={() => textInput.setInput(prompt)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      textInput.setInput(prompt);
                    }
                  }}
                  className={cn(
                    "group cursor-pointer rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm",
                    "transition-all duration-150 ease-out",
                    "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
                    "active:translate-y-0 active:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  <div className={cn("flex items-center gap-2", accent)}>
                    <Icon
                      className="size-3.5 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                      {active}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-foreground/90 group-hover:text-foreground">
                    {prompt}
                  </p>
                </Card>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Previously" strip — Fraunces-italic catalogue line of recent films.
// ---------------------------------------------------------------------------

function PreviouslyStrip() {
  const { data } = useRecentFilms(5);
  if (!data || data.length === 0) return null;
  const titles = data.map((f) => f.title).join(" · ");
  return (
    <p className="text-center font-serif text-xs italic text-muted-foreground">
      Previously · {titles}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Thread renderer. Layer 3 — every message type from
// `Clevroy_Chat_Surface.md §2` is routed through `<MessageRenderer />`:
// user / narration / activity / system + the five asset kinds (scene_image,
// scene_playback, character_refs, assembly_preview, final_film).
//
// Activity messages are passed through `compactActivities` so the spec's
// "≤1 DOM message per 3s" throttle (CC-5) holds even when the phase walker
// (or, later, Realtime) emits a burst.
// ---------------------------------------------------------------------------

function ThreadMessages({ filmId }: { filmId: string | null | undefined }) {
  const hydrated = useHydrated();
  const messages = useMessages(filmId);
  const endRef = React.useRef<HTMLDivElement>(null);

  // Throttle activity bursts before render. Cheap reduce; runs only when the
  // message list grows.
  const compacted = React.useMemo(
    () => (hydrated ? compactActivities(messages) : []),
    [hydrated, messages],
  );

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [compacted.length]);

  return (
    <div
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6"
      aria-live="polite"
      aria-label="Conversation"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
        {compacted.map(({ message, collapsedActivityCount }) => (
          <MessageRenderer
            key={message.id}
            message={message}
            collapsedActivityCount={collapsedActivityCount}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode views
// ---------------------------------------------------------------------------

function EmptyView({
  firstName,
  onSubmit,
  disabled,
}: {
  firstName: string | null | undefined;
  onSubmit?: (payload: ChatSubmit) => void;
  disabled?: boolean;
}) {
  const aspect = useAspect();
  const setAspect = useSetAspect();
  const style = useStyle();
  const setStyle = useSetStyle();

  // Item 13. Layout is the same DOM, two layouts:
  //   - Mobile: welcome at top, suggestions below it, mt-auto pushes the
  //     input wrapper to the bottom of the viewport (sticky + safe-area).
  //   - Desktop (sm+): everything centers as before; order returns to
  //     welcome → input → style chips → suggestions → previously strip.
  return (
    <section className="flex flex-1 flex-col px-4 pt-6 sm:items-center sm:justify-center sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 sm:flex-initial">
        <WelcomeBlock firstName={firstName} />

        {/* Mobile: suggestions render directly under welcome. */}
        <div className="order-2 sm:order-4">
          <StoryboardSuggestions />
        </div>

        {/* Mobile: style chips sit just above the docked input. */}
        <div className="order-3 sm:order-3">
          <StyleChips value={style} onChange={setStyle} />
        </div>

        {/* Mobile: spacer pushes the input wrapper to the bottom. Hidden
            on sm+ so the desktop layout stays compact. */}
        <div className="order-3 flex-1 sm:hidden" />

        {/* Mobile: input docks to bottom edge, safe-area aware, with a
            light bg veil so suggestions don't bleed through. Desktop:
            normal in-flow. */}
        <div
          className={cn(
            "order-4 sm:order-2",
            "sticky bottom-0 -mx-4 bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur",
            "sm:relative sm:m-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0",
          )}
        >
          <SubmitConsumer
            onSubmit={onSubmit}
            disabled={disabled}
            showSlate
            aspect={aspect}
            onAspectChange={setAspect}
            draftScope="home"
          />
        </div>

        {/* Previously strip — desktop only; on mobile the docked input
            owns the bottom edge and there's no room for a footer line. */}
        <div className="order-5 hidden sm:block">
          <PreviouslyStrip />
        </div>
      </div>
    </section>
  );
}

function ThreadView({
  filmId,
  onSubmit,
  disabled,
}: {
  filmId: string | null | undefined;
  onSubmit?: (payload: ChatSubmit) => void;
  disabled?: boolean;
}) {
  const aspect = useAspect();
  const setAspect = useSetAspect();

  // Layer 3 phase-walker integration. Runs the six-phase fixture timeline
  // (Clevroy_Chat_Surface.md §3) when a thread is fresh — i.e. it has at
  // least one `user` message but no `narration` messages yet. Once Layer
  // 4/5 lands a real Realtime stream, this whole block goes away in favor
  // of the server-driven `useChat({ initialMessages, streamData })` flow.
  const messages = useMessages(filmId);
  const firstUserText = React.useMemo(() => {
    for (const m of messages) {
      if (m.type === "user") return m.content;
    }
    return "";
  }, [messages]);
  const hasNarration = React.useMemo(
    () => messages.some((m) => m.type === "narration"),
    [messages],
  );
  const walkerEnabled = Boolean(
    filmId && firstUserText.length > 0 && !hasNarration,
  );
  usePhaseWalker(filmId ?? null, firstUserText, { enabled: walkerEnabled });

  return (
    <section className="flex h-full flex-1 flex-col">
      <ThreadMessages filmId={filmId} />
      <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto w-full max-w-2xl">
          <SubmitConsumer
            onSubmit={onSubmit}
            disabled={disabled}
            aspect={aspect}
            onAspectChange={setAspect}
            draftScope={filmId ? `thread:${filmId}` : null}
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ChatSurfaceProps {
  firstName?: string | null;
  /** Visual mode. `empty` centers input + welcome + storyboard cards;
   *  `thread` anchors input to bottom and renders optimistic messages above. */
  mode?: "empty" | "thread";
  /** Active film_id for thread mode. The chat store keys threads by this
   *  id so /films/[id-A] and /films/[id-B] don't collide. Required when
   *  `mode === "thread"`; ignored in empty mode. */
  filmId?: string | null;
  /** Called with the textarea text + any attached files when the user
   *  submits. The visual shell is intentionally unwired — the parent
   *  decides what happens on submit (mint film_id + route, fire useChat,
   *  etc.). */
  onSubmit?: (payload: ChatSubmit) => void;
  /** Disables the input + submit (e.g. while a mint-film call is in flight). */
  disabled?: boolean;
  className?: string;
}

export function ChatSurface({
  firstName,
  mode = "empty",
  filmId,
  onSubmit,
  disabled,
  className,
}: ChatSurfaceProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <PromptInputProvider>
        {mode === "thread" ? (
          <ThreadView filmId={filmId} onSubmit={onSubmit} disabled={disabled} />
        ) : (
          <EmptyView
            firstName={firstName}
            onSubmit={onSubmit}
            disabled={disabled}
          />
        )}
      </PromptInputProvider>
    </div>
  );
}
