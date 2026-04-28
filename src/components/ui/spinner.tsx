import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Clevroy filmstrip loader. Three film frames pulsing in a left-to-right
 * wave so the indicator reads as "running film" at a glance — on-brand for a
 * cinema product where Loader2's generic spin would feel anonymous.
 *
 * Renders as an SVG so it inherits text color (`currentColor` on each rect)
 * — set tone via `text-primary` / `text-muted-foreground` / etc. on the
 * call site. Sizes via Tailwind (`size-4` default; bump to `size-6` /
 * `size-8` for hero loaders). Animation respects `prefers-reduced-motion`
 * — when reduced motion is on, the frames render full-opacity static, so
 * the icon still reads as a recognizable mark with no movement.
 *
 * Keyframes live in `app/globals.css` (`@keyframes film-flicker`) — keeping
 * the timing curve out of inline style means motion designers can tweak it
 * in one place if the cadence ever needs to feel slower / brisker.
 */
export interface SpinnerProps extends React.ComponentProps<"svg"> {
  /** Override the screen-reader label. Defaults to "Loading". Pass `null`
   *  to mark the icon as decorative when surrounding text already
   *  announces the loading state. */
  label?: string | null;
}

function Spinner({ label = "Loading", className, ...props }: SpinnerProps) {
  const a11yProps = label
    ? { role: "status" as const, "aria-label": label }
    : { "aria-hidden": true };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4 shrink-0", className)}
      {...a11yProps}
      {...props}
    >
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={3 + i * 7}
          y={6}
          width={5}
          height={12}
          rx={1}
          fill="currentColor"
          className="motion-safe:opacity-30 motion-safe:animate-[film-flicker_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </svg>
  );
}

export { Spinner };
