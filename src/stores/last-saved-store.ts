"use client";

import { create } from "zustand";

/**
 * Tracks the most recent successful save across all of /settings/*, plus a
 * per-route dirty set so the layout's <TabsTrigger> can render the
 * primary-color dot next to a sub-route with unsaved changes.
 *
 * Not persisted — the indicator is a session-scoped UX hint, not a record.
 */
type LastSavedStore = {
  lastSavedAt: number | null;
  dirtyRoutes: ReadonlySet<string>;

  markSaved: () => void;
  setDirty: (route: string, dirty: boolean) => void;
  clearDirty: () => void;
};

export const useLastSavedStore = create<LastSavedStore>((set) => ({
  lastSavedAt: null,
  dirtyRoutes: new Set<string>(),

  markSaved: () => set({ lastSavedAt: Date.now() }),

  setDirty: (route, dirty) =>
    set((state) => {
      const next = new Set(state.dirtyRoutes);
      if (dirty) {
        next.add(route);
      } else {
        next.delete(route);
      }
      return { dirtyRoutes: next };
    }),

  clearDirty: () => set({ dirtyRoutes: new Set<string>() }),
}));
