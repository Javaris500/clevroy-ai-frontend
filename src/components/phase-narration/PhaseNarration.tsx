"use client";

// <PhaseNarration /> — the cinematic state-driven headline + subline block
// sitting immediately below <CenterStage />.
// Spec: Design_System §8.3 + §14 (crossfade timings), CC-2 (reduced motion),
// CC-5 (aria-live polite as the canonical "what's happening now" source).
//
// This is the one place in the app where Framer Motion is used outside
// <CenterStage /> itself. Everything else in the UI uses native CSS
// transitions (per Dev_Overview §3.2).

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import type { FilmState } from "@/types/film-state";
import {
  headlineForState,
  phaseNarration,
  type NarrationContext,
} from "@/lib/copy";

export type PhaseNarrationProps = {
  state: FilmState;
  context?: NarrationContext;
  className?: string;
};

export function PhaseNarration({
  state,
  context,
  className,
}: PhaseNarrationProps) {
  const prefersReducedMotion = useReducedMotion();

  const headline = useMemo(
    () => headlineForState(state, context),
    [state, context],
  );
  const subline = useMemo(
    () => phaseNarration[state].subline(context),
    [state, context],
  );

  // Full motion: outgoing 200ms, incoming 450ms, 100ms overlap (§14).
  // Reduced motion: collapse to a 150ms simple crossfade so the phase change
  // still feels intentional rather than popping instantly (CC-2).
  const exit = prefersReducedMotion
    ? { opacity: 0, transition: { duration: 0.15 } }
    : { opacity: 0, transition: { duration: 0.2, ease: "easeOut" as const } };

  const animate = prefersReducedMotion
    ? { opacity: 1, transition: { duration: 0.15 } }
    : {
        opacity: 1,
        transition: {
          duration: 0.45,
          delay: 0.1, // 100ms overlap with the outgoing fade
          ease: [0.16, 1, 0.3, 1] as const, // --ease-out
        },
      };

  return (
    <section
      // Canonical screen-reader source of truth for generation phase (CC-5).
      aria-live="polite"
      aria-atomic="true"
      className={[
        "relative w-full",
        "flex flex-col items-center justify-center text-center",
        "px-4",
        className ?? "",
      ].join(" ")}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={state}
          initial={{ opacity: 0 }}
          animate={animate}
          exit={exit}
          className="flex flex-col items-center"
        >
          <h2
            className={[
              // Fraunces italic 28/36/500 per typography scale text-phase.
              "font-serif italic",
              "text-[28px] leading-9 font-medium",
              "text-[--color-foreground]",
            ].join(" ")}
          >
            {headline}
          </h2>
          {subline ? (
            <p
              className={[
                // Inter body, muted, centered.
                "mt-2 text-base leading-6",
                "text-[--color-muted-foreground]",
              ].join(" ")}
            >
              {subline}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export default PhaseNarration;
