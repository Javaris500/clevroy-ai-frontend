"use client";

import { useEffect } from "react";

import { useUIStore, type ThemePreference } from "@/stores/ui-store";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "light";
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

/**
 * Applies the resolved theme as a class on <html>.
 *
 * Theme v2 (docs/Clevroy_Theme_v2.css): light is the :root default; the
 * `.dark` class triggers the dark token overrides via
 * `@custom-variant dark (&:is(.dark *))` in app/globals.css.
 */
function applyTheme(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = resolveTheme(preference);
  root.classList.toggle("dark", resolved === "dark");
  // Clean up the legacy v1 class if it's lingering from a prior session.
  root.classList.remove("light");
}

function applyReducedMotion(override: boolean | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (override === true) {
    root.setAttribute("data-reduced-motion", "true");
  } else {
    root.removeAttribute("data-reduced-motion");
  }
}

/**
 * Mount once at the root (via <ThemeSync />). Keeps <html> in sync with the
 * Zustand store and reacts to system-preference changes when theme is
 * "system".
 */
export function useApplyTheme(): void {
  const theme = useUIStore((s) => s.theme);
  const reducedMotionOverride = useUIStore((s) => s.reducedMotionOverride);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mql = window.matchMedia(SYSTEM_DARK_QUERY);
    const listener = () => applyTheme("system");
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [theme]);

  useEffect(() => {
    applyReducedMotion(reducedMotionOverride);
  }, [reducedMotionOverride]);
}

/**
 * Synchronous script injected into <head> before React hydrates. Reads the
 * persisted preference from localStorage and applies the .dark class so the
 * page never paints a wrong-mode flash on first frame.
 *
 * Falls back to the user's system preference when no persisted choice exists.
 * That fallback is what makes the v2 default of "light :root" behave like
 * "dark on dark devices" by default — system-first, persisted choice wins.
 */
export const themeInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('clevroy.ui');
    var pref = 'system';
    var rm = null;
    if (raw) {
      var parsed = JSON.parse(raw);
      var s = parsed && parsed.state ? parsed.state : {};
      if (s.theme === 'light' || s.theme === 'dark' || s.theme === 'system') pref = s.theme;
      if (s.reducedMotionOverride === true || s.reducedMotionOverride === false) rm = s.reducedMotionOverride;
    }
    var resolved = pref;
    if (pref === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    if (rm === true) document.documentElement.setAttribute('data-reduced-motion', 'true');
  } catch (e) {}
})();
`;
