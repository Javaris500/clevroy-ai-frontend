// Brand-voice toast helpers (EC-G10).
//
// `<Toaster />` is mounted once at the root by Leia (`app/layout.tsx`).
// Anywhere in the app — Realtime listeners, mutation onSuccess handlers,
// route guards — can call these helpers to surface a toast in Clevroy's
// voice. Never call `sonner.toast(...)` directly with a raw string; route
// every user-facing toast through here so the copy audit can lint it.
//
// The helpers map 1:1 to the EC-G10 cases:
//   - filmReady       → completion toast
//   - filmError       → film-hit-a-problem toast
//   - filmRefunded    → cancel-with-partial-refund toast (EC-G6)
//   - inProgress      → "still being shot" navigation toast
//   - sceneAlreadyReshooting → 409 dedup toast (EC-G8)
//   - reconnected / connectionLost → Realtime banner-style toasts (EC-G2)

import { toast } from "sonner";

import { globalToasts } from "@/lib/copy";

export interface FilmActionToastOptions {
  /** Click target — typically a router push. Sonner runs this on action click. */
  onAction: () => void;
}

/** Generation completed somewhere in the app. EC-G10 — fires on every page. */
export function filmReadyToast({ onAction }: FilmActionToastOptions) {
  toast.success(globalToasts.filmReady.title, {
    description: globalToasts.filmReady.body,
    action: {
      label: globalToasts.filmReady.action,
      onClick: onAction,
    },
  });
}

/** Film entered the `error` state somewhere in the app. */
export function filmErrorToast({ onAction }: FilmActionToastOptions) {
  toast.warning(globalToasts.filmError.title, {
    description: globalToasts.filmError.body,
    action: {
      label: globalToasts.filmError.action,
      onClick: onAction,
    },
  });
}

/** EC-G6 partial-refund toast. `refunded` is the NUMERIC(8,2) string from
 *  the cancel response — never coerce to number. */
export function filmRefundedToast(refunded: string) {
  const copy = globalToasts.filmRefunded(refunded);
  toast(copy.title, { description: copy.body });
}

/** EC-G10 — fires when the user navigates away from the generation screen
 *  while their film is still being shot. */
export function inProgressNavigationToast({ onAction }: FilmActionToastOptions) {
  toast(globalToasts.inProgressNavigation.title, {
    description: globalToasts.inProgressNavigation.body,
    duration: 4000,
    action: {
      label: "Watch",
      onClick: onAction,
    },
  });
}

/** EC-G8 — backend returned 409 because a reshoot for that scene was already
 *  running. */
export function sceneAlreadyReshootingToast() {
  toast(globalToasts.sceneAlreadyReshooting);
}

/** EC-G2 — Realtime socket reconnected. Fades quickly. */
export function reconnectedToast() {
  toast.success(globalToasts.reconnected, { duration: 1000 });
}

/** EC-G2 — Realtime socket dropped. Sticks until manually dismissed; the
 *  reconnected toast supersedes it. */
export function connectionLostToast() {
  toast.warning(globalToasts.connectionLost, {
    duration: Infinity,
    id: "clevroy.connection-lost",
  });
}

/** Dismisses the connectionLost toast (used by EC-G2's reconnected handler). */
export function dismissConnectionLost() {
  toast.dismiss("clevroy.connection-lost");
}
