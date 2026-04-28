"use client";

// <ActivityFeed /> — timestamped log of backend generation events.
// Spec: Design_System §8.6, EC-G7 (DOM cap 50/30, older behind collapsible),
// CC-5 (aria-live polite, throttled to 1/3s), CC-6 (copy routed through
// src/lib/copy.ts).
//
// Entries are produced by Stratum's Realtime subscription and passed in as a
// prop. This component is a pure view — it does not subscribe to anything.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";

import type { ActivityKind } from "@/types/film-state";
import { activityFeed } from "@/lib/copy";

export type ActivityFeedEntry = {
  id: string;
  /** Absolute timestamp of the backend event — NOT the time of arrival.
   *  EC-G2 requires original timestamps to survive socket reconnects. */
  timestamp: Date | string | number;
  kind: ActivityKind;
  message: string;
};

export type ActivityFeedProps = {
  entries: ActivityFeedEntry[];
  className?: string;
  /** Override for testing / Storybook. Defaults to matchMedia. */
  isMobile?: boolean;
};

const JUMP_THRESHOLD_PX = 40;
const ARIA_THROTTLE_MS = 3000;

export function ActivityFeed({
  entries,
  className,
  isMobile: isMobileProp,
}: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobileDetected = useIsNarrow(isMobileProp);
  const cap = isMobileDetected ? 30 : 50;

  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);
  const [expandedEarlier, setExpandedEarlier] = useState(false);
  const [earlierPageCount, setEarlierPageCount] = useState(1);

  // Throttled aria-live — 1 announcement per 3 seconds max per CC-5.
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncedAtRef = useRef(0);
  const pendingAnnounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  // Partition entries into "earlier" (above the cap) and "visible" (within cap).
  const { visibleEntries, earlierEntries } = useMemo(() => {
    if (entries.length <= cap) {
      return { visibleEntries: entries, earlierEntries: [] as ActivityFeedEntry[] };
    }
    const split = entries.length - cap;
    return {
      earlierEntries: entries.slice(0, split),
      visibleEntries: entries.slice(split),
    };
  }, [entries, cap]);

  // Pagination of earlier events — batches of 50 when expanded (EC-G7).
  // NOTE: swap this block for @tanstack/react-virtual when the package is
  //       installed. The DOM never exceeds cap + (earlierPageCount * 50)
  //       which is acceptable until virtualization is wired up.
  const earlierBatchSize = 50;
  const earlierShown = useMemo(
    () =>
      expandedEarlier
        ? earlierEntries.slice(
            Math.max(0, earlierEntries.length - earlierPageCount * earlierBatchSize),
          )
        : [],
    [earlierEntries, expandedEarlier, earlierPageCount],
  );
  const remainingEarlier = Math.max(
    0,
    earlierEntries.length - earlierShown.length,
  );

  // Auto-scroll to bottom when a new entry arrives and user is "at bottom".
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries, stickToBottom, earlierShown.length]);

  // Announce the latest event politely, throttled to 1 per 3s. CC-5.
  useEffect(() => {
    const latest = entries[entries.length - 1];
    if (!latest || latest.id === lastSeenIdRef.current) return;
    lastSeenIdRef.current = latest.id;

    const now = Date.now();
    const elapsed = now - lastAnnouncedAtRef.current;
    const announce = () => {
      lastAnnouncedAtRef.current = Date.now();
      setAnnouncement(latest.message);
    };
    if (pendingAnnounceRef.current) {
      clearTimeout(pendingAnnounceRef.current);
      pendingAnnounceRef.current = null;
    }
    if (elapsed >= ARIA_THROTTLE_MS) {
      announce();
    } else {
      pendingAnnounceRef.current = setTimeout(
        announce,
        ARIA_THROTTLE_MS - elapsed,
      );
    }
    return () => {
      if (pendingAnnounceRef.current) {
        clearTimeout(pendingAnnounceRef.current);
        pendingAnnounceRef.current = null;
      }
    };
  }, [entries]);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom =
      el.scrollHeight - el.clientHeight - el.scrollTop;
    const atBottom = distanceFromBottom <= 2; // 2px slop for subpixel rounding
    const showJumpNow = distanceFromBottom > JUMP_THRESHOLD_PX;
    setStickToBottom(atBottom);
    setShowJump(showJumpNow);
  }, []);

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
    setShowJump(false);
  }, []);

  return (
    <div
      className={[
        "relative flex h-full flex-col",
        "rounded-[12px] border border-[--color-border] bg-[--color-card]",
        className ?? "",
      ].join(" ")}
    >
      <div
        ref={scrollRef}
        role="log"
        aria-label={activityFeed.ariaRegionLabel}
        onScroll={handleScroll}
        className={[
          "flex-1 overflow-y-auto",
          "px-3 py-2",
          "font-mono text-[13px] leading-5",
        ].join(" ")}
      >
        {earlierEntries.length > 0 ? (
          <div className="mb-2">
            {!expandedEarlier ? (
              <button
                type="button"
                onClick={() => setExpandedEarlier(true)}
                className={[
                  "w-full rounded-md px-2 py-1 text-left",
                  "text-[--color-muted-foreground] hover:bg-[--color-accent] hover:text-[--color-accent-foreground]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-card]",
                ].join(" ")}
              >
                {activityFeed.viewEarlier(earlierEntries.length)}
              </button>
            ) : (
              <>
                {remainingEarlier > 0 ? (
                  <button
                    type="button"
                    onClick={() => setEarlierPageCount((n) => n + 1)}
                    className={[
                      "mb-1 w-full rounded-md px-2 py-1 text-left",
                      "text-[--color-muted-foreground] hover:bg-[--color-accent] hover:text-[--color-accent-foreground]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-card]",
                    ].join(" ")}
                  >
                    {activityFeed.viewEarlier(remainingEarlier)}
                  </button>
                ) : null}
                {earlierShown.map((entry) => (
                  <EntryLine key={entry.id} entry={entry} />
                ))}
              </>
            )}
          </div>
        ) : null}

        {visibleEntries.map((entry) => (
          <EntryLine key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Jump-to-latest pill. Appears >40px from bottom. */}
      {showJump ? (
        <button
          type="button"
          onClick={jumpToLatest}
          className={[
            "absolute bottom-3 right-3",
            "rounded-full px-3 py-1 text-xs font-medium",
            "bg-[--color-primary] text-[--color-primary-foreground]",
            "shadow-sm hover:bg-[--color-primary-hover]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-card]",
          ].join(" ")}
        >
          {activityFeed.jumpToLatest}
        </button>
      ) : null}

      {/* Throttled live region. Error entries announce via this same channel
          because they're still polite announcements during normal flow; truly
          interruptive errors (EC-G5) come from PhaseNarration's aria-live. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only absolute -m-px h-px w-px overflow-hidden border-0 p-0 [clip:rect(0,0,0,0)]"
      >
        {announcement}
      </div>
    </div>
  );
}

function EntryLine({ entry }: { entry: ActivityFeedEntry }) {
  const isError = entry.kind === "error";
  const time = formatClock(entry.timestamp);
  return (
    <div
      className={[
        "flex items-start gap-2 py-[2px]",
        isError ? "text-[--color-destructive]" : "text-[--color-foreground]",
      ].join(" ")}
    >
      <span className="shrink-0 text-[--color-muted-foreground]">{time}</span>
      <span
        aria-hidden="true"
        className={[
          "shrink-0 text-center",
          "w-3",
          iconColor(entry.kind),
        ].join(" ")}
      >
        {iconGlyph(entry.kind)}
      </span>
      <span className="min-w-0 break-words">{entry.message}</span>
    </div>
  );
}

function iconGlyph(kind: ActivityKind): string {
  // Typographic symbols, not emoji. CC-5 requires color + icon (never color
  // alone) to signal state.
  switch (kind) {
    case "active":
      return "●";
    case "complete":
      return "✓";
    case "warning":
      return "!";
    case "error":
      return "✕";
  }
}

function iconColor(kind: ActivityKind): string {
  switch (kind) {
    case "active":
      return "text-[--color-primary]";
    case "complete":
      return "text-[--color-success]";
    case "warning":
      return "text-[--color-warning]";
    case "error":
      return "text-[--color-destructive]";
  }
}

function formatClock(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  // HH:MM:SS local, 24h per Design_System §8.6.
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function useIsNarrow(override?: boolean): boolean {
  const [narrow, setNarrow] = useState<boolean>(() => override ?? false);
  useEffect(() => {
    if (override !== undefined) {
      setNarrow(override);
      return;
    }
    // Sidebar-to-bottom-bar breakpoint from Design_System §10.1.
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [override]);
  return narrow;
}

export default ActivityFeed;
