"use client";

import * as React from "react";
import { toast } from "sonner";

import { useLastSavedStore } from "@/stores/last-saved-store";

export interface UseAutosaveOptions<T> {
  /** Reactive value to autosave. Hook fires when this changes after debounce. */
  value: T;
  /** Persistence callback. Should resolve when the save lands. */
  onSave: (value: T) => Promise<void> | void;
  /** Debounce window before firing onSave. Default 400ms. */
  debounceMs?: number;
  /** Toast message on success. Pass `null` to skip the toast. */
  toastSuccess?: ((value: T) => string) | null;
  /** Toast message on failure. Defaults to a brand-voice fallback. */
  toastError?: ((error: unknown) => string) | null;
  /** Set to false to bypass the autosave entirely. Useful when a parent
   *  knows the value hasn't been hydrated yet. */
  enabled?: boolean;
}

/**
 * Generic autosave hook for the autosave-side of the split-save model.
 * Debounces rapid changes, fires `onSave` once the value settles, surfaces
 * a Sonner toast on success, and bumps the global `last-saved-store` so the
 * settings shell's indicator updates.
 *
 * Skips the very first render so loading the page from persisted state
 * doesn't trigger a save round-trip.
 */
export function useAutosave<T>({
  value,
  onSave,
  debounceMs = 400,
  toastSuccess,
  toastError,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const markSaved = useLastSavedStore((s) => s.markSaved);
  const initialRef = React.useRef(true);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  React.useEffect(() => {
    if (!enabled) return;
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }

    const timer = window.setTimeout(async () => {
      const current = valueRef.current;
      try {
        await onSave(current);
        markSaved();
        if (toastSuccess !== null) {
          const message = toastSuccess
            ? toastSuccess(current)
            : "Saved.";
          toast.success(message);
        }
      } catch (err) {
        const message = toastError
          ? toastError(err)
          : toastError === null
            ? null
            : "Couldn't save that. Try again.";
        if (message) toast.error(message);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
    // We deliberately depend on `value` so a fresh debounce starts whenever
    // it changes. onSave / toast formatters are read off refs, so they don't
    // need to be in the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, debounceMs, enabled]);
}
