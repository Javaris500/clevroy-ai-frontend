"use client";

import { useEffect, useState } from "react";

// Returns true once `loading` has been true continuously for >= delayMs.
// Drives the Design_System §12.4 "Still loading your films…" swap that
// reassures the user when the initial fetch crosses the 3-second mark.

export function useStillLoading(loading: boolean, delayMs = 3000): boolean {
  const [stillLoading, setStillLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setStillLoading(false);
      return;
    }
    const t = setTimeout(() => setStillLoading(true), delayMs);
    return () => clearTimeout(t);
  }, [loading, delayMs]);

  return stillLoading;
}
