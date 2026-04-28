"use client";

// Phase: `parsing`. The center stage shows the script text streaming in line
// by line, with scene-break markers (`[Scene N]`, `INT.`, `EXT.`) highlighted
// as the parser identifies them. Design_System §8.4: "tells the user 'we're
// reading your words' better than any abstract loading animation."

import { useEffect, useRef, useState } from "react";

export type ParsingStageProps = {
  scriptText: string;
  prefersReducedMotion: boolean;
};

const SCENE_BREAK_RE = /^(?:\[scene\b|int\.|ext\.|fade in|fade out)/i;

export function ParsingStage({ scriptText, prefersReducedMotion }: ParsingStageProps) {
  const lines = scriptText.split("\n");
  const [revealed, setRevealed] = useState(prefersReducedMotion ? lines.length : 1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reveal lines on a timer so the script "streams in" while parsing runs.
  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealed(lines.length);
      return;
    }
    if (revealed >= lines.length) return;
    const t = setTimeout(() => setRevealed((r) => Math.min(lines.length, r + 1)), 120);
    return () => clearTimeout(t);
  }, [revealed, lines.length, prefersReducedMotion]);

  // Auto-scroll to keep the latest revealed line visible.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [revealed]);

  return (
    <div
      ref={scrollRef}
      // Visual-only animation; the phase narration block above carries the
      // canonical screen-reader announcement (CC-5).
      aria-hidden="true"
      className="h-full w-full overflow-y-auto px-6 py-5 font-mono text-[13px] leading-6 text-muted-foreground"
    >
      {lines.slice(0, revealed).map((line, i) => {
        const isBreak = SCENE_BREAK_RE.test(line.trim());
        return (
          <div
            key={i}
            className={[
              "whitespace-pre-wrap",
              isBreak ? "mt-3 font-semibold uppercase tracking-wider text-primary" : "",
            ].join(" ")}
          >
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}

export default ParsingStage;
