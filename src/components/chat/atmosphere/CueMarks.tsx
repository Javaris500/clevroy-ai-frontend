"use client";

/**
 * Cue marks — the two small dots that appear in the top-right corner
 * of a real film print signaling a reel changeover. Pure decoration.
 * Hidden on mobile to keep the safe area uncluttered.
 */
export function CueMarks() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-4 top-3 z-30 hidden flex-col items-center gap-1.5 md:flex"
    >
      <span className="size-1.5 rounded-full bg-foreground/25" />
      <span className="size-1.5 rounded-full bg-foreground/25" />
    </div>
  );
}
