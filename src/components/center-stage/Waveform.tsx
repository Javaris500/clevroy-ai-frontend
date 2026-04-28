"use client";

// Tiny SVG-based waveform animation. Decorative — every consumer should pair
// it with the appropriate aria-hidden / phase narration so screen readers
// see the phase change in copy, not motion (CC-5).

import { useEffect, useRef, useState } from "react";

export type WaveformProps = {
  /** Pixel height of the waveform area. */
  height: number;
  /** CSS color (use a CSS variable like `var(--primary)`). */
  color: string;
  /** When true, freeze a single static frame (reduced motion / CC-2). */
  paused?: boolean;
  /** `line` for a horizontal scope wave; `bars` for vertical bars. */
  variant?: "line" | "bars";
  /** Bar count for the bars variant. */
  bars?: number;
  className?: string;
};

export function Waveform({
  height,
  color,
  paused = false,
  variant = "line",
  bars = 48,
  className,
}: WaveformProps) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) {
      setT(0.5);
      return;
    }
    let mounted = true;
    const start = performance.now();
    const tick = (now: number) => {
      if (!mounted) return;
      setT((now - start) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused]);

  if (variant === "bars") {
    return (
      <div
        aria-hidden="true"
        className={["flex h-full w-full items-end justify-center gap-1", className ?? ""].join(" ")}
        style={{ height }}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const phase = (i / bars) * Math.PI * 2 + t * 2;
          const a = 0.35 + 0.5 * Math.abs(Math.sin(phase));
          const b = 0.55 + 0.4 * Math.abs(Math.sin(phase * 0.6 + t));
          const h = paused ? 0.5 : (a + b) / 2;
          return (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 4,
                height: `${Math.max(6, h * height)}px`,
                background: color,
              }}
            />
          );
        })}
      </div>
    );
  }

  // line variant — a single horizontal sine path
  const width = 800; // viewBox width; SVG scales to container
  const points = Array.from({ length: 80 }).map((_, i) => {
    const x = (i / 79) * width;
    const k = i / 79;
    const wobble = paused ? 0 : Math.sin(k * Math.PI * 6 + t * 2) * 0.5;
    const y = height / 2 + wobble * (height * 0.45);
    return `${x},${y}`;
  });
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className={["h-full w-full", className ?? ""].join(" ")}
      style={{ height }}
      preserveAspectRatio="none"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Waveform;
