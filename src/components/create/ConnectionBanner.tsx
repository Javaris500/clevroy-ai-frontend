"use client";

// EC-G2 — connection-lost banner. Slides down from the top of the main
// generation panel when the Realtime socket disconnects. On reconnect the
// banner says "Reconnected." for 1 second, then fades. Generation continues
// on the backend either way.

import { useEffect, useState } from "react";

import type { RealtimeStatus } from "@/hooks/use-film-realtime";
import { connectionBanner } from "@/lib/copy";

export type ConnectionBannerProps = {
  status: RealtimeStatus;
  className?: string;
};

type Visible = "off" | "reconnecting" | "reconnected";

export function ConnectionBanner({ status, className }: ConnectionBannerProps) {
  const [visible, setVisible] = useState<Visible>("off");

  // Track when we go from a problematic status back to connected so we can
  // briefly show "Reconnected.".
  useEffect(() => {
    if (status === "reconnecting" || status === "disconnected") {
      setVisible("reconnecting");
      return;
    }
    if (status === "connected") {
      // Was the banner visible? If yes, show the success line briefly.
      setVisible((prev) => (prev === "reconnecting" ? "reconnected" : "off"));
    }
  }, [status]);

  // Fade out the success line after 1s.
  useEffect(() => {
    if (visible !== "reconnected") return;
    const t = setTimeout(() => setVisible("off"), 1000);
    return () => clearTimeout(t);
  }, [visible]);

  if (visible === "off") return null;

  const isRecovered = visible === "reconnected";

  return (
    <div
      // EC-G2: assertive while disconnected (so screen readers interrupt),
      // polite when recovered.
      role="status"
      aria-live={isRecovered ? "polite" : "assertive"}
      className={[
        "absolute inset-x-3 top-3 z-10 flex items-center justify-center",
        "rounded-md px-3 py-2",
        "text-small",
        isRecovered
          ? "bg-success/15 text-success"
          : "bg-warning/15 text-warning",
        // Slide-in. Reduced motion users get the static class only.
        "motion-safe:animate-[slideDown_var(--duration-base,200ms)_ease-out]",
        className ?? "",
      ].join(" ")}
    >
      {isRecovered ? connectionBanner.reconnected : connectionBanner.reconnecting}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ConnectionBanner;
