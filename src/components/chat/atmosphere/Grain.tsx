"use client";

const NOISE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>" +
      "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter>" +
      "<rect width='220' height='220' filter='url(%23n)' opacity='0.85'/>" +
      "</svg>",
  );

/**
 * Film-grain overlay — barely-there noise across the entire shell,
 * stronger in dark mode. Hidden under prefers-reduced-motion (some
 * users find static grain visually noisy too).
 */
export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[40] opacity-[0.05] mix-blend-overlay motion-reduce:hidden dark:opacity-[0.08]"
      style={{ backgroundImage: `url("${NOISE_SVG}")` }}
    />
  );
}
