"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "clevroy:dev-mode";

/**
 * Resolves whether developer mode is on for this browser session.
 *
 * Three escape hatches, in priority order:
 *   1. `NEXT_PUBLIC_DEVELOPER_TOOLS=true` — env override (CI/local).
 *   2. `?dev=1` in the URL — flips a session-storage flag on the way in.
 *   3. `clevroy:dev-mode` in sessionStorage — set by (2) or by the About
 *      page's 7-tap easter egg.
 *
 * The flag is session-scoped (not localStorage) so closing the browser
 * resets visibility — staff use, not a permanent preference.
 */
export function useDevMode(): boolean {
  const params = useSearchParams();
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_DEVELOPER_TOOLS === "true") {
      setEnabled(true);
      return;
    }
    if (params?.get("dev") === "1") {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      setEnabled(true);
      return;
    }
    setEnabled(window.sessionStorage.getItem(STORAGE_KEY) === "1");
  }, [params]);

  return enabled;
}

/** Imperatively enable dev mode (used by the About page easter egg). */
export function enableDevMode(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, "1");
}
