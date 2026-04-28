"use client";

import * as React from "react";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Live SMPTE-style timecode (HH:MM:SS:FF, 24fps frame counter).
 * Pinned bottom-right of the inset. Hidden under md so it doesn't fight
 * the mobile chat input. Decorative — pure cinematic chrome.
 *
 * Initial render returns null so SSR and the first client paint match
 * (Date.now() differs across boundaries → hydration mismatch). The
 * timecode populates from the first interval tick after mount; users
 * see it appear within ~200ms, well below the perceptual gap that
 * would read as "missing chrome".
 */
export function Timecode() {
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  if (now === null) return null;

  const d = new Date(now);
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const ff = pad2(Math.floor((d.getMilliseconds() / 1000) * 24));

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-3 right-4 z-30 hidden font-mono text-[10px] tracking-[0.18em] text-muted-foreground md:block"
    >
      {hh}:{mm}:{ss}:{ff}
    </div>
  );
}
