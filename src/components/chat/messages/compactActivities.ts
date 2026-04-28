import type { ThreadMessage } from "@/stores/chat-store";

/**
 * Activity throttle (Clevroy_Chat_Surface.md §2.4 / CC-5).
 *
 * Walk a time-sorted message list and collapse consecutive `activity`
 * entries that fall inside the same 3-second window. The last activity
 * inside the window becomes the visible one; earlier siblings are dropped
 * from the rendered output and their count is attached as
 * `collapsedActivityCount` on the visible row.
 *
 * Non-activity messages pass through unchanged. The output preserves the
 * input ordering — important because activities interleave with narration
 * and asset cards in time.
 */
const ACTIVITY_WINDOW_MS = 3_000;

export type CompactedThreadMessage = {
  message: ThreadMessage;
  collapsedActivityCount?: number;
};

export function compactActivities(
  messages: ReadonlyArray<ThreadMessage>,
): ReadonlyArray<CompactedThreadMessage> {
  const out: CompactedThreadMessage[] = [];
  // Index in `out` of the most recently emitted activity, if any. Used to
  // bump its `collapsedActivityCount` when the next activity falls inside
  // the throttle window.
  let lastActivityIndex = -1;
  let lastActivityAt = 0;

  for (const message of messages) {
    if (message.type !== "activity") {
      out.push({ message });
      // A non-activity message ends the throttle window — the next activity
      // (if any) starts fresh.
      lastActivityIndex = -1;
      lastActivityAt = 0;
      continue;
    }

    if (
      lastActivityIndex !== -1 &&
      message.createdAt - lastActivityAt < ACTIVITY_WINDOW_MS
    ) {
      // Replace the previously-emitted activity row with this newer one
      // and bump the collapsed count.
      const prev = out[lastActivityIndex]!;
      const collapsed = (prev.collapsedActivityCount ?? 0) + 1;
      out[lastActivityIndex] = {
        message,
        collapsedActivityCount: collapsed,
      };
      lastActivityAt = message.createdAt;
      continue;
    }

    out.push({ message });
    lastActivityIndex = out.length - 1;
    lastActivityAt = message.createdAt;
  }

  return out;
}
