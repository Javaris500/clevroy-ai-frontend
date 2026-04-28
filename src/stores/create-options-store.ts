"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Persistent create-options preferences. Replaces the local `useState` calls
 * for aspect + style in `EmptyView` / `ThreadView` so that toggling a value,
 * navigating away, and coming back doesn't reset the choice. Also lets
 * future surfaces (e.g. /create's input phase, the Create dialog) read the
 * same defaults.
 *
 * Layer 4/5 will pass these into mintFilm's payload.
 *
 * Same hydration model as chat-store: gate consumers with `useHydrated()`
 * to avoid an SSR/CSR mismatch flash.
 */

export const ASPECTS = ["16:9", "9:16", "1:1"] as const;
export type Aspect = (typeof ASPECTS)[number];

export const STYLE_PRESETS = ["Cinematic", "Documentary", "Noir", "Animated"] as const;
export type StylePreset = (typeof STYLE_PRESETS)[number];

export type CreateOptionsStore = {
  aspect: Aspect;
  style: StylePreset | null;
  setAspect: (a: Aspect) => void;
  setStyle: (s: StylePreset | null) => void;
};

export const useCreateOptionsStore = create<CreateOptionsStore>()(
  persist(
    (set) => ({
      aspect: "16:9",
      style: null,
      setAspect: (aspect) => set({ aspect }),
      setStyle: (style) => set({ style }),
    }),
    {
      name: "clevroy:create-options:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ aspect: state.aspect, style: state.style }),
    },
  ),
);

// Selector hooks — keep call-site code free of `(s) => s.x` boilerplate.

export function useAspect(): Aspect {
  return useCreateOptionsStore((s) => s.aspect);
}

export function useSetAspect() {
  return useCreateOptionsStore((s) => s.setAspect);
}

export function useStyle(): StylePreset | null {
  return useCreateOptionsStore((s) => s.style);
}

export function useSetStyle() {
  return useCreateOptionsStore((s) => s.setStyle);
}
