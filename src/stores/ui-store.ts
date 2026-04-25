"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

export interface UIState {
  /** User's chosen theme. `system` follows `prefers-color-scheme`. */
  theme: ThemePreference;
  /** Desktop sidebar expanded/collapsed. Tablet defaults to collapsed
   *  unless the user has explicitly expanded. */
  sidebarCollapsed: boolean;
  /** If true, force reduced motion regardless of system preference
   *  (Design System §11.4, Settings > Preferences). `null` means follow
   *  the system media query. */
  reducedMotionOverride: boolean | null;

  setTheme: (theme: ThemePreference) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setReducedMotionOverride: (override: boolean | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme v2 default — system-first; persisted choice wins on subsequent
      // visits. The initial paint goes through themeInitScript in <head> so
      // there's no light-mode flash on dark devices.
      theme: "system",
      sidebarCollapsed: false,
      reducedMotionOverride: null,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setReducedMotionOverride: (reducedMotionOverride) =>
        set({ reducedMotionOverride })
    }),
    {
      name: "clevroy.ui",
      storage: createJSONStorage(() => localStorage),
      version: 1
    }
  )
);
