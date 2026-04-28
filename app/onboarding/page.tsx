"use client";

// Onboarding — single client route, two-step machine.
//
// Earlier shape was three server pages (welcome / theme / start) wired by
// router.push and <Link>. Each click meant a full Next.js navigation, which
// on mid-tier devices read as lag. Folded into one route so step transitions
// are local state changes — AnimatePresence handles the visual handoff.
// Welcome step was dropped entirely (it restated the home-page CTA).
//
// CC-1 (Brand_Guide / UX_Edge_Cases) still requires an explicit theme choice;
// that's step 1 here. Step 2 is the "5 free films" promise.

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { onboarding } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

import { OnboardingProgress } from "./progress";

// Same easing curve the Theme v2 motion tokens use (--ease-out in
// app/globals.css). Keeping it in JS so Framer Motion shares the feel.
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Step = 1 | 2;

export default function OnboardingPage() {
  const [step, setStep] = React.useState<Step>(1);
  const setTheme = useUIStore((s) => s.setTheme);

  const handleThemePick = (theme: "light" | "dark") => {
    setTheme(theme);
    // Hold long enough that the layout's transition-colors animates the
    // background swap *before* AnimatePresence mounts the next step. The
    // theme commit becomes part of the choreography instead of a flash.
    window.setTimeout(() => setStep(2), 350);
  };

  return (
    <div className="relative w-full">
      <AmbientLight />
      <div className="mb-10">
        <OnboardingProgress current={step} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <ThemeStep key="theme" onPick={handleThemePick} />
        ) : (
          <StartStep key="start" onBack={() => setStep(1)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step shell — handles the in/out crossfade between steps.
// ---------------------------------------------------------------------------

function StepShell({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.section
      initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="space-y-10"
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — theme choice with live preview cards.
// ---------------------------------------------------------------------------

function ThemeStep({ onPick }: { onPick: (t: "dark" | "light") => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <StepShell>
      <header className="space-y-3">
        <motion.p
          className="text-caption text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          {onboarding.theme.eyebrow}
        </motion.p>
        <StaggeredTitle text={onboarding.theme.title} startDelay={0.08} />
        <motion.p
          className="text-body-lg text-muted-foreground"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : 0.32,
            duration: 0.4,
            ease: EASE_OUT,
          }}
        >
          {onboarding.theme.body}
        </motion.p>
      </header>
      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: reducedMotion ? 0 : 0.46,
          duration: 0.45,
          ease: EASE_OUT,
        }}
      >
        <ThemePreviewCard
          variant="dark"
          label={onboarding.theme.keepDark}
          metaLabel="Studio"
          onSelect={() => onPick("dark")}
        />
        <ThemePreviewCard
          variant="light"
          label={onboarding.theme.switchToLight}
          metaLabel="Paper"
          onSelect={() => onPick("light")}
        />
      </motion.div>
    </StepShell>
  );
}

// Theme v2 OKLCH values, hard-coded so each preview renders correctly
// regardless of the document's current .dark class. Throwaway-acceptable
// duplication — onboarding is a one-shot surface and SceneStrip (the real
// component) hasn't shipped yet.
const PREVIEW_TOKENS = {
  dark: {
    bg: "oklch(0.1591 0 0)",
    card: "oklch(0.2002 0 0)",
    fg: "oklch(0.9543 0.0136 78.2625)",
    muted: "oklch(0.6862 0 0)",
    border: "oklch(0.2686 0 0)",
  },
  light: {
    bg: "oklch(0.9778 0.0058 91.7)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.1591 0 0)",
    muted: "oklch(0.5031 0.0093 91.7)",
    border: "oklch(0.9116 0.0145 87.0)",
  },
} as const;
const PREVIEW_PRIMARY = "oklch(0.5882 0.2309 28.2936)";

function ThemePreviewCard({
  variant,
  label,
  metaLabel,
  onSelect,
}: {
  variant: "dark" | "light";
  label: string;
  metaLabel: string;
  onSelect: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const tokens = PREVIEW_TOKENS[variant];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={reducedMotion ? undefined : { y: -4 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className={cn(
        "group relative flex min-h-[176px] flex-col gap-3 rounded-xl border p-3 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-shadow duration-200 hover:shadow-lg",
      )}
      style={{
        backgroundColor: tokens.bg,
        borderColor: tokens.border,
        color: tokens.fg,
      }}
      aria-label={label}
    >
      {/* Mini scene card — echoes the real Clevroy frame at 1/6 scale. */}
      <div
        className="flex aspect-video w-full items-end overflow-hidden rounded-lg p-3"
        style={{
          backgroundColor: tokens.card,
          borderColor: tokens.border,
          borderWidth: 1,
        }}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div className="space-y-1">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.08em]"
              style={{ color: PREVIEW_PRIMARY }}
            >
              Scene 1
            </p>
            <p
              className="text-xs font-semibold"
              style={{ color: tokens.fg, fontFamily: "var(--font-serif)" }}
            >
              {onboarding.theme.previewTitle}
            </p>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: PREVIEW_PRIMARY, color: "oklch(1 0 0)" }}
          >
            00:08
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium" style={{ color: tokens.fg }}>
          {label}
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ color: tokens.muted }}
        >
          {metaLabel}
        </span>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — the "5 free films" promise + a faux scene-strip that develops in.
// ---------------------------------------------------------------------------

function StartStep({ onBack }: { onBack: () => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <StepShell>
      <header className="space-y-3">
        <StaggeredTitle text={onboarding.start.title} startDelay={0.05} />
        <motion.p
          className="text-body-lg text-muted-foreground"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : 0.5,
            duration: 0.4,
            ease: EASE_OUT,
          }}
        >
          {onboarding.start.body}
        </motion.p>
      </header>

      <ScenePreviewStrip />

      <motion.div
        className="flex flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: reducedMotion ? 0 : 0.95,
          duration: 0.4,
          ease: EASE_OUT,
        }}
      >
        <motion.div
          whileHover={reducedMotion ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="inline-block"
        >
          <Button asChild>
            <Link href="/create">{onboarding.start.cta}</Link>
          </Button>
        </motion.div>
        <Button asChild variant="ghost">
          <Link href="/home">{onboarding.start.skipToHome}</Link>
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="ml-auto inline-flex items-center gap-1 text-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          {onboarding.backLabel}
        </button>
      </motion.div>
    </StepShell>
  );
}

function ScenePreviewStrip() {
  const reducedMotion = useReducedMotion();
  return (
    <div
      role="group"
      aria-label="A preview of how a script becomes scenes"
      className="grid gap-3 sm:grid-cols-3"
    >
      {onboarding.start.previewFrames.map((frame, i) => (
        <motion.figure
          key={frame.label}
          initial={{
            opacity: 0,
            y: reducedMotion ? 0 : 14,
            scale: reducedMotion ? 1 : 0.96,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: reducedMotion ? 0 : 0.55 + i * 0.08,
            duration: 0.55,
            ease: EASE_OUT,
          }}
          className="flex flex-col gap-2"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-card">
            {/* Index chip in the corner — JetBrains Mono mirrors the
                scene-id treatment used elsewhere in the app. */}
            <div className="absolute left-3 top-3">
              <span className="rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            {/* Soft bottom gradient gives each frame depth without an image. */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
            {/* The "develop" sweep — a primary-soft band crosses each frame
                once on mount. Reads as film being processed. */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 motion-reduce:hidden"
              style={{
                background:
                  "linear-gradient(120deg, transparent 30%, var(--primary-soft) 50%, transparent 70%)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                delay: reducedMotion ? 0 : 0.7 + i * 0.08,
                duration: 1.4,
                ease: EASE_OUT,
              }}
            />
          </div>
          <figcaption className="space-y-0.5 px-0.5">
            <p className="text-caption text-muted-foreground">{frame.label}</p>
            <p className="text-small text-foreground">{frame.caption}</p>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Title with per-word entrance stagger — Fraunces lift, ~60ms apart.
// ---------------------------------------------------------------------------

function StaggeredTitle({
  text,
  startDelay = 0,
}: {
  text: string;
  startDelay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const words = text.split(" ");
  return (
    <h1 className="text-display-md">
      {/* Screen readers get the whole phrase; sighted users see the stagger. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : startDelay + i * 0.06,
              duration: 0.45,
              ease: EASE_OUT,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

// ---------------------------------------------------------------------------
// Ambient key light — soft Cinematic-Red glow at the top of the viewport
// that breathes 0.6 → 1.0 → 0.6 over 8s. Suggests a film studio key light
// without committing to a literal letterbox or film-strip frame.
// ---------------------------------------------------------------------------

function AmbientLight() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[60vh] motion-reduce:opacity-70"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, var(--primary-soft), transparent 70%)",
      }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
