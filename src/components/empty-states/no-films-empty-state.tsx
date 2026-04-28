"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { emptyStates, navLinks } from "@/lib/copy";
import { cn } from "@/lib/utils";

type NoFilmsEmptyStateProps = {
  /** Hide the "5 free films" hint on Projects (it lives on Home only). */
  showFreeFilmsHint?: boolean;
};

// Used by /home (when the user has zero films) and /projects (when the
// account has no films at all). Frames absence as invitation per
// Brand_Guide §7.4.
//
// Settings_Projects_Brief A.7 §8 — "Cinematic empty state": three faux
// scene-strip frames slide in from the right behind the headline, looping
// every 8 seconds. Reduced motion: same three frames, painted statically,
// no loop.

const FRAME_COUNT = 3;
const FRAME_STAGGER_MS = 80;
const LOOP_MS = 8_000;
const FRAME_TINTS = [
  "from-primary-soft to-transparent",
  "from-amber-500/20 to-transparent",
  "from-sky-500/20 to-transparent",
] as const;

function SceneStripBackdrop() {
  const reduceMotion = useReducedMotion();
  // `tick` advances every LOOP_MS so framer-motion gets a fresh `key` and
  // re-runs the slide-in. `useReducedMotion()` may settle null during the
  // first render — coerce so we treat null and false the same.
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (reduceMotion === true) return;
    const id = window.setInterval(() => setTick((t) => t + 1), LOOP_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const animated = reduceMotion !== true;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="flex w-full max-w-3xl items-center justify-center gap-3 px-6">
        {Array.from({ length: FRAME_COUNT }).map((_, i) => (
          <motion.div
            key={`${tick}-${i}`}
            initial={animated ? { opacity: 0, x: 24 } : false}
            animate={{ opacity: 0.55, x: 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: animated ? (i * FRAME_STAGGER_MS) / 1000 : 0,
            }}
            className={cn(
              "relative aspect-video flex-1 overflow-hidden rounded-md border border-border/60",
              "bg-gradient-to-br",
              FRAME_TINTS[i] ?? FRAME_TINTS[0],
            )}
          >
            {/* Top + bottom sprocket-strip lines, evoking 35mm. */}
            <span className="absolute inset-x-0 top-1 flex justify-around opacity-40">
              {Array.from({ length: 6 }).map((_, j) => (
                <span
                  key={j}
                  className="h-1 w-2 rounded-sm bg-foreground/30"
                />
              ))}
            </span>
            <span className="absolute inset-x-0 bottom-1 flex justify-around opacity-40">
              {Array.from({ length: 6 }).map((_, j) => (
                <span
                  key={j}
                  className="h-1 w-2 rounded-sm bg-foreground/30"
                />
              ))}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function NoFilmsEmptyState({
  showFreeFilmsHint = true,
}: NoFilmsEmptyStateProps) {
  // films_remaining is a NUMERIC(8,2) string. Only render the free-films hint
  // when the balance is > 0; once a user has spent it, the line stops being
  // true and we stay quiet.
  const { profile } = useProfile();
  const filmsRemainingNumeric = (() => {
    const raw = profile?.films_remaining;
    if (!raw) return 0;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  })();
  const showFreeFilms = showFreeFilmsHint && filmsRemainingNumeric > 0;

  return (
    <div className="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border border-border bg-card px-6 py-20 text-center">
      <SceneStripBackdrop />
      <div className="relative flex flex-col gap-2">
        <h2 className="text-phase italic text-foreground">
          {emptyStates.noFilms.headline}
        </h2>
        <p className="text-body text-muted-foreground">
          {emptyStates.noFilms.description}
        </p>
      </div>
      <div className="relative flex flex-col items-center gap-3">
        <Button asChild size="lg">
          <Link href={navLinks.home.href}>{emptyStates.noFilms.cta}</Link>
        </Button>
        {showFreeFilms ? (
          <p className="text-small text-muted-foreground">
            {emptyStates.noFilms.freeFilmsHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
