"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { ThreadMessage } from "@/stores/chat-store";

/**
 * `activity` message renderer (Clevroy_Chat_Surface.md §2.4).
 *
 * Quiet log entries. Left-aligned, no bubble, single line, JetBrains Mono
 * timestamp + Inter `text-sm text-muted-foreground` body.
 *
 * Throttle (CC-5): the spec asks for ≤1 DOM message per 3s with rapid
 * bursts collapsing into a count summary. The thread-level dispatcher
 * applies that compaction; this component is the leaf renderer and trusts
 * its caller to pass already-throttled entries.
 */
export interface ActivityMessageProps {
  message: ThreadMessage;
  /** Optional collapsed-burst count appended after the body when several
   *  activity events were merged into this one (e.g. "+3 events"). */
  collapsedCount?: number;
}

function formatHHMM(epoch: number): string {
  const d = new Date(epoch);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function ActivityMessage({
  message,
  collapsedCount,
}: ActivityMessageProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="mr-auto flex items-baseline gap-2"
    >
      <span
        aria-hidden="true"
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70"
      >
        {formatHHMM(message.createdAt)}
      </span>
      <span className="text-sm text-muted-foreground">
        {message.content}
        {typeof collapsedCount === "number" && collapsedCount > 0 ? (
          <span className="ml-1 text-muted-foreground/70">
            {" "}
            +{collapsedCount} {collapsedCount === 1 ? "event" : "events"}
          </span>
        ) : null}
      </span>
    </motion.div>
  );
}
