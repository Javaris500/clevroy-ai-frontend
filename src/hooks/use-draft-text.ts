"use client";

import * as React from "react";

const STORAGE_PREFIX = "clevroy:draft:";
const AUTOSAVE_INTERVAL_MS = 2_000;

function storageKey(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

/**
 * Lightweight sessionStorage-backed draft autosave. Mirrors the EC-N5 pattern
 * in CreateClient.tsx but scoped to a caller-supplied key so drafts on /home
 * don't bleed into per-film thread drafts and vice versa.
 *
 * Contract:
 *   - The textarea (or other input) owns the live `value`. This hook owns
 *     the persistence side.
 *   - `restored` is the value read from sessionStorage on mount. The
 *     consumer is responsible for pushing it back into the input (typically
 *     via `usePromptInputController().textInput.setInput(restored)`).
 *   - `save(value)` writes the current value at most every 2s — the hook
 *     batches writes via a setInterval so a bursty typer doesn't hit
 *     storage on every keystroke.
 *   - `clear()` drops the persisted value (call on submit).
 *
 * Scope keys:
 *   - "home" for the empty-thread input on /home.
 *   - `thread:${filmId}` for an in-thread input on /films/[id].
 *   - The hook handles a missing/undefined scope by no-oping safely.
 */
export type UseDraftText = {
  /** The value found in sessionStorage on mount, or `null` if none. */
  restored: string | null;
  /** Push the current value through the autosave loop. Cheap to call on
   *  every keystroke — the hook batches writes. */
  save: (value: string) => void;
  /** Drop the persisted value. Call on submit. */
  clear: () => void;
};

export function useDraftText(scope: string | null | undefined): UseDraftText {
  const [restored, setRestored] = React.useState<string | null>(null);
  const liveRef = React.useRef<string>("");
  const lastWrittenRef = React.useRef<string>("");
  const scopeRef = React.useRef(scope);

  // Track scope so the autosave interval rewrites under the new key when
  // the consumer's scope changes (e.g. a thread is re-entered).
  React.useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  // On mount (and on scope change), read the persisted value once.
  React.useEffect(() => {
    if (typeof window === "undefined" || !scope) {
      setRestored(null);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(storageKey(scope));
      if (raw && raw.length > 0) {
        setRestored(raw);
        lastWrittenRef.current = raw;
        liveRef.current = raw;
      } else {
        setRestored(null);
        lastWrittenRef.current = "";
        liveRef.current = "";
      }
    } catch {
      setRestored(null);
    }
  }, [scope]);

  // Autosave loop. Single interval per mount; checks the live ref against
  // the last write and persists only when they diverge.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      const currentScope = scopeRef.current;
      if (!currentScope) return;
      const value = liveRef.current;
      if (value === lastWrittenRef.current) return;
      try {
        if (value.length === 0) {
          window.sessionStorage.removeItem(storageKey(currentScope));
        } else {
          window.sessionStorage.setItem(storageKey(currentScope), value);
        }
        lastWrittenRef.current = value;
      } catch {
        // Quota / private mode — silent. The next interval will retry.
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const save = React.useCallback((value: string) => {
    liveRef.current = value;
  }, []);

  const clear = React.useCallback(() => {
    liveRef.current = "";
    lastWrittenRef.current = "";
    if (typeof window === "undefined") return;
    const currentScope = scopeRef.current;
    if (!currentScope) return;
    try {
      window.sessionStorage.removeItem(storageKey(currentScope));
    } catch {
      // Quota / private mode — silent.
    }
  }, []);

  return { restored, save, clear };
}
