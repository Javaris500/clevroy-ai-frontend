"use client";

import { useApplyTheme } from "@/lib/theme";

/**
 * Mounts the theme-sync side effect from src/lib/theme.ts. Renders nothing.
 * Kept as a tiny client component so the root layout can stay a Server
 * Component.
 */
export function ThemeSync() {
  useApplyTheme();
  return null;
}
