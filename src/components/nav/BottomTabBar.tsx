"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  Clapperboard,
  FolderOpen,
  Home,
  Settings,
  UserSquare,
  type LucideIcon,
} from "lucide-react";

import { bottomTabBar as copy, navLinks, type NavLinkKey } from "@/lib/copy";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.5;
const ICON_SIZE = 20;
const HINT_STORAGE_KEY = "clevroy.bottomTabBarHint";
const HINT_MAX_SHOWS = 3;
/** Time the soft glow stays on the Create button (EC-N1). */
const HINT_GLOW_MS = 2000;
/** Time the caption stays visible (EC-N1). */
const HINT_CAPTION_MS = 3000;

type TabSlot = {
  key: NavLinkKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * 5-slot tab bar order — sourced from the locked `navLinks` registry so
 * Create stays in the center slot. Don't shuffle.
 *
 * TODO(nav): bottom tab bar at 6+ slots; demote AI Twin or Settings to a
 * profile menu now that Library has joined the primary nav. Sidebar already
 * shows all six entries; this bar is currently overloaded — the AI Twin slot
 * has been demoted to make room for Library, and AI Twin lives only in the
 * sidebar + the "Edit your AI Twin" link inside /library/characters.
 */
const TAB_ORDER: ReadonlyArray<TabSlot> = [
  { key: "home", ...navLinks.home, icon: Home },
  { key: "projects", ...navLinks.projects, icon: FolderOpen },
  { key: "create", ...navLinks.create, icon: Clapperboard },
  { key: "library", ...navLinks.library, icon: BookMarked },
  { key: "settings", ...navLinks.settings, icon: Settings },
];

function isActiveHref(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type CapacitorListenerHandle = { remove: () => Promise<void> | void };

type CapacitorRuntime = {
  isNativePlatform?: () => boolean;
  Plugins?: {
    Haptics?: { impact?: (opts: { style: string }) => Promise<void> | void };
    Keyboard?: {
      addListener?: (
        eventName: "keyboardWillShow" | "keyboardWillHide",
        handler: () => void,
      ) => Promise<CapacitorListenerHandle> | CapacitorListenerHandle;
    };
  };
};

/**
 * Pixel margin used by the web fallback to decide that the soft keyboard is
 * open. iOS Safari + Android Chrome both shrink `window.visualViewport.height`
 * by roughly the keyboard's height; the typical phone keyboard is ≥ 240px, so
 * 150px is a comfortable threshold that won't fire from the URL bar collapsing.
 */
const KEYBOARD_VIEWPORT_THRESHOLD = 150;

/**
 * Tracks whether the on-screen keyboard is open so the bar can translate
 * offscreen (B.18). Native: Capacitor `Keyboard.addListener('keyboardWillShow' |
 * 'keyboardWillHide')`. Web: `visualViewport.resize` heuristic. Feature-
 * detected at runtime — `@capacitor/keyboard` is not statically imported,
 * matching the haptics pattern above so the web build doesn't pull native
 * deps.
 */
function useKeyboardOpen(active: boolean): boolean {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setOpen(false);
      return;
    }
    if (typeof window === "undefined") return;

    const cap = (window as Window & { Capacitor?: CapacitorRuntime }).Capacitor;
    const isNative = !!cap && cap.isNativePlatform?.() === true;

    if (isNative && cap?.Plugins?.Keyboard?.addListener) {
      const keyboard = cap.Plugins.Keyboard;
      const handles: CapacitorListenerHandle[] = [];
      let cancelled = false;
      const collect = (
        result: Promise<CapacitorListenerHandle> | CapacitorListenerHandle,
      ) => {
        Promise.resolve(result).then((handle) => {
          if (cancelled) {
            try {
              void handle.remove();
            } catch {
              // Plugin tore down before we could detach — silent.
            }
          } else {
            handles.push(handle);
          }
        });
      };
      collect(keyboard.addListener!("keyboardWillShow", () => setOpen(true)));
      collect(keyboard.addListener!("keyboardWillHide", () => setOpen(false)));
      return () => {
        cancelled = true;
        for (const handle of handles) {
          try {
            void handle.remove();
          } catch {
            // Listener already gone — silent.
          }
        }
      };
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const check = () => {
      const reduced = window.innerHeight - vv.height;
      setOpen(reduced > KEYBOARD_VIEWPORT_THRESHOLD);
    };
    vv.addEventListener("resize", check);
    check();
    return () => {
      vv.removeEventListener("resize", check);
    };
  }, [active]);

  return open;
}

/** Light haptic feedback on the Create button tap when running inside the
 * Capacitor v7 native shell. No-ops in the web build (Capacitor isn't
 * installed yet at the time of writing — feature-detected at runtime). */
function triggerLightHaptic() {
  if (typeof window === "undefined") return;
  const cap = (window as Window & { Capacitor?: CapacitorRuntime }).Capacitor;
  if (!cap || cap.isNativePlatform?.() !== true) return;
  try {
    cap.Plugins?.Haptics?.impact?.({ style: "Light" });
  } catch {
    // Plugin not registered or runtime mismatch — silent.
  }
}

type HintRecord = { shows: number; dismissed: boolean };

function readHint(): HintRecord {
  if (typeof window === "undefined") return { shows: 0, dismissed: false };
  try {
    const raw = window.localStorage.getItem(HINT_STORAGE_KEY);
    if (!raw) return { shows: 0, dismissed: false };
    const parsed = JSON.parse(raw) as Partial<HintRecord> | null;
    return {
      shows: typeof parsed?.shows === "number" ? parsed.shows : 0,
      dismissed: parsed?.dismissed === true,
    };
  } catch {
    return { shows: 0, dismissed: false };
  }
}

function writeHint(record: HintRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HINT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota exceeded or storage unavailable — non-fatal; hint just shows again.
  }
}

/**
 * BottomTabBar — Clevroy's mobile primary nav (Design_System §6).
 *
 * Five slots in the locked Home / Projects / Create / AI Twin / Settings
 * order. Create is the elevated 64px primary-colored circle raised 12px above
 * the bar baseline (so it breaks the top edge). 72px nominal height plus
 * `safe-area-inset-bottom` so notched devices and home indicators stay clear.
 *
 * Hidden ≥ md breakpoint — desktop and tablet use <AppSidebar /> instead.
 *
 * Hidden during active film generation per Design_System §6.3 (Fantem's
 * generation screen replaces the bar with a Cancel slot). The (app) layout
 * decides; this component itself stays presentational.
 *
 * B.18 — keyboard avoidance: when the on-screen keyboard opens (e.g. focusing
 * the script textarea on /create), the bar slides offscreen via a CSS
 * transform so it never overlaps the input. The component stays mounted so
 * the slide-in/out reads as motion rather than a pop. Native uses Capacitor
 * `Keyboard.addListener('keyboardWillShow' | 'keyboardWillHide')`; web uses
 * the `visualViewport` resize heuristic.
 *
 * EC-N1 — first-three-opens hint:
 *   - Reads `localStorage[clevroy.bottomTabBarHint]` on mount.
 *   - If `dismissed === false` and `shows < 3`, paints a 2s primary-soft
 *     glow on the center Create button and a 3s caption "Tap Create to
 *     start a film" beneath it, then increments `shows`.
 *   - On `shows === 3` after the show, or any tab interaction, sets
 *     `dismissed: true` so the hint never returns.
 */
export interface BottomTabBarProps {
  /** When the generation screen takes over the bar (Design_System §6.3),
   * the (app) layout sets `hidden` so this component is replaced by
   * Fantem's Cancel bar. */
  hidden?: boolean;
  className?: string;
}

export function BottomTabBar({ hidden = false, className }: BottomTabBarProps) {
  const pathname = usePathname();
  const [showGlow, setShowGlow] = React.useState(false);
  const [showCaption, setShowCaption] = React.useState(false);
  const dismissedRef = React.useRef(true);
  const keyboardOpen = useKeyboardOpen(!hidden);

  // EC-N1: schedule the hint on mount if eligible.
  React.useEffect(() => {
    if (hidden) return;
    const record = readHint();
    dismissedRef.current = record.dismissed || record.shows >= HINT_MAX_SHOWS;
    if (dismissedRef.current) return;

    const nextShows = record.shows + 1;
    const reachesCap = nextShows >= HINT_MAX_SHOWS;
    writeHint({ shows: nextShows, dismissed: reachesCap });

    setShowGlow(true);
    setShowCaption(true);
    const glowTimer = window.setTimeout(() => setShowGlow(false), HINT_GLOW_MS);
    const captionTimer = window.setTimeout(
      () => setShowCaption(false),
      HINT_CAPTION_MS,
    );
    return () => {
      window.clearTimeout(glowTimer);
      window.clearTimeout(captionTimer);
    };
  }, [hidden]);

  function dismissHint() {
    if (dismissedRef.current && !showGlow && !showCaption) return;
    dismissedRef.current = true;
    setShowGlow(false);
    setShowCaption(false);
    writeHint({ shows: HINT_MAX_SHOWS, dismissed: true });
  }

  if (hidden) return null;

  return (
    <nav
      aria-label={copy.ariaLabel}
      aria-hidden={keyboardOpen ? true : undefined}
      // `inert` prevents focus from landing inside the bar while it's
      // translated offscreen (keyboard avoidance, B.18). Older runtimes that
      // don't support it fall back to pointer-events-none + aria-hidden.
      inert={keyboardOpen}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 md:hidden",
        // 72px bar + safe-area inset for notched devices.
        "h-[calc(72px+var(--spacing-safe-bottom))]",
        "border-t border-border bg-card",
        // Allow the elevated Create button to break the top edge cleanly.
        "pb-[var(--spacing-safe-bottom)]",
        // B.18 — keyboard avoidance. translate-y-full slides the entire bar
        // (including the elevated Create button) below the viewport. Duration
        // collapses to 0ms under prefers-reduced-motion via the token.
        "transition-transform ease-[var(--ease-out)] [transition-duration:var(--duration-base)]",
        keyboardOpen && "pointer-events-none translate-y-full",
        className,
      )}
    >
      <ul className="grid h-[72px] grid-cols-5 items-end px-1">
        {TAB_ORDER.map((slot) => {
          const active = isActiveHref(pathname, slot.href);
          const Icon = slot.icon;
          if (slot.key === "create") {
            return (
              <li key={slot.key} className="relative flex items-end justify-center">
                <Link
                  href={slot.href}
                  aria-label={copy.createAria}
                  onClick={() => {
                    triggerLightHaptic();
                    dismissHint();
                  }}
                  className={cn(
                    // 64×64 circle raised 12px above the bar baseline so the
                    // top half breaks the top border. Centered horizontally.
                    "relative -top-3 inline-flex size-16 items-center justify-center rounded-full",
                    "bg-primary text-primary-foreground shadow-lg",
                    "transition-transform active:scale-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    showGlow && "ring-4 ring-primary-soft motion-safe:animate-pulse",
                  )}
                >
                  <Clapperboard
                    aria-hidden="true"
                    width={28}
                    height={28}
                    strokeWidth={ICON_STROKE}
                  />
                </Link>
                {showCaption ? (
                  <span
                    role="status"
                    className={cn(
                      "absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full",
                      "whitespace-nowrap rounded-md bg-popover px-2 py-1 text-caption font-medium text-popover-foreground",
                      "shadow-md",
                    )}
                  >
                    {copy.firstOpenHint}
                  </span>
                ) : null}
              </li>
            );
          }

          return (
            <li key={slot.key} className="flex justify-center">
              <Link
                href={slot.href}
                onClick={dismissHint}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-[72px] w-14 flex-col items-center justify-center gap-1",
                  // 56×72 hit area meets the 44×44 minimum (Design_System §10.2).
                  "rounded-md transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* B.29 — unified active-state gesture: 4px primary
                 *  indicator. Sidebar uses a left pill; the tab bar mirrors
                 *  it as a centered top pill that flush-mounts to the bar's
                 *  top border. */}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-1 w-8 -translate-x-1/2 rounded-b-full bg-primary"
                  />
                ) : null}
                <Icon
                  aria-hidden="true"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                />
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {slot.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
