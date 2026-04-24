"use client";

import { useEffect } from "react";

import { useUIStore, type ThemePreference } from "@/stores/ui-store";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

/**
 * Applies the resolved theme as a class on <html>. Baseline tokens in
 * globals.css are dark; the `light` class triggers the :root.light overrides.
 * Design System §2.1.
 */
function applyTheme(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = resolveTheme(preference);
  root.classList.toggle("light", resolved === "light");
}

/**
 * Writes the reduced-motion override to a data attribute on <html>.
 * The CSS in globals.css keys off `html[data-reduced-motion="true"]`.
 */
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
 * Mount this once at the root of the app (e.g. inside app/layout.tsx's
 * client shell). It keeps the <html> classes in sync with the Zustand
 * store and reacts to system-preference changes when theme is "system".
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
 * Synchronous script injected into <head> before React hydrates so the
 * user never sees a light-mode flash before the stored preference kicks in.
 */
export const themeInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('clevroy.ui');
    var pref = 'dark';
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
    if (resolved === 'light') document.documentElement.classList.add('light');
    if (rm === true) document.documentElement.setAttribute('data-reduced-motion', 'true');
  } catch (e) {}
})();
`;
