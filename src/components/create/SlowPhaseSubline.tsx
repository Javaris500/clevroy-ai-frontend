"use client";

// EC-G9 — appears under the phase narration subline when a phase exceeds its
// p95 expected duration (~90s in MVP), upgrading to the p99 message at ~180s.
// Tracks time-in-phase locally; replace with a backend `phase_slow` event
// when Stratum's Realtime feed emits one.

import { useEffect, useState } from "react";

import { slowPhase } from "@/lib/copy";

export type SlowPhaseLevel = "normal" | "p95" | "p99";

export type SlowPhaseSublineProps = {
  /** ISO 8601 timestamp of when the current phase started. Resetting this
   * value resets the slowness tracker. */
  phaseStartedAt: string | null;
  /** Override for tests / Storybook. */
  initialLevel?: SlowPhaseLevel;
  /** Notify parent (e.g. so the cancel link can warn). */
  onLevelChange?: (level: SlowPhaseLevel) => void;
  className?: string;
};

const P95_MS = 90_000;
const P99_MS = 180_000;

export function SlowPhaseSubline({
  phaseStartedAt,
  initialLevel = "normal",
  onLevelChange,
  className,
}: SlowPhaseSublineProps) {
  const [level, setLevel] = useState<SlowPhaseLevel>(initialLevel);

  useEffect(() => {
    setLevel("normal");
    onLevelChange?.("normal");
    if (!phaseStartedAt) return;
    const start = new Date(phaseStartedAt).getTime();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= P99_MS) {
        setLevel((prev) => {
          if (prev !== "p99") onLevelChange?.("p99");
          return "p99";
        });
      } else if (elapsed >= P95_MS) {
        setLevel((prev) => {
          if (prev !== "p95") onLevelChange?.("p95");
          return "p95";
        });
      }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [phaseStartedAt, onLevelChange]);

  if (level === "normal") return null;

  return (
    <p
      // Polite — not an interruption. This sits under the phase narration's
      // own polite live region; the throttling on that region keeps the
      // combined announcement rate sensible (CC-5).
      role="status"
      aria-live="polite"
      className={[
        "text-small",
        level === "p99" ? "text-warning" : "text-muted-foreground",
        className ?? "",
      ].join(" ")}
    >
      {level === "p99" ? slowPhase.p99 : slowPhase.p95}
    </p>
  );
}

export default SlowPhaseSubline;
