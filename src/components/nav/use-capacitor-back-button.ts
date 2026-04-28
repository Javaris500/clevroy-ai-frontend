"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type CapacitorListenerHandle = { remove: () => Promise<void> | void };

type BackButtonEvent = { canGoBack: boolean };

type CapacitorRuntime = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    App?: {
      addListener?: (
        eventName: "backButton",
        handler: (event: BackButtonEvent) => void,
      ) => Promise<CapacitorListenerHandle> | CapacitorListenerHandle;
      exitApp?: () => Promise<void> | void;
    };
  };
};

/**
 * Capacitor §3 — Android back-button bridge. Without this, the Android
 * hardware back button exits the app at every screen instead of popping the
 * Next.js route stack. iOS has no hardware back button so the hook is a
 * no-op there; the web build never attaches anything.
 *
 * Behavior:
 *   - `event.canGoBack === true`  → `router.back()` (App Router popstate).
 *   - `event.canGoBack === false` → `App.exitApp()` (root, leave the app).
 *
 * Feature-detected at runtime — `@capacitor/app` is not statically imported
 * so the web bundle stays clean (matches the haptics + keyboard pattern in
 * `BottomTabBar.tsx`). The hook must be called from a single mounted
 * surface inside the (app) shell; calling it twice would attach two
 * listeners and double-pop on each press.
 */
export function useCapacitorBackButton(): void {
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const cap = (window as Window & { Capacitor?: CapacitorRuntime }).Capacitor;
    if (!cap || cap.isNativePlatform?.() !== true) return;
    if (cap.getPlatform?.() !== "android") return;

    const app = cap.Plugins?.App;
    if (!app?.addListener) return;

    let handle: CapacitorListenerHandle | undefined;
    let cancelled = false;

    const result = app.addListener("backButton", (event) => {
      if (event.canGoBack) {
        router.back();
        return;
      }
      try {
        void app.exitApp?.();
      } catch {
        // Plugin missing or runtime mismatch — silent.
      }
    });

    Promise.resolve(result).then((h) => {
      if (cancelled) {
        try {
          void h.remove();
        } catch {
          // Listener already gone — silent.
        }
      } else {
        handle = h;
      }
    });

    return () => {
      cancelled = true;
      if (handle) {
        try {
          void handle.remove();
        } catch {
          // Listener already gone — silent.
        }
      }
    };
  }, [router]);
}
