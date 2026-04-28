"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { ThreadMessage } from "@/stores/chat-store";

/**
 * `system` message renderer (Clevroy_Chat_Surface.md §2.5).
 *
 * Centered, badge-style, used sparingly. Examples: "Stopped. 0.2 films
 * refunded.", "Reconnected.", "This film hit a problem. We saved what
 * finished." Brand voice forbids "Oops" and "Something went wrong" — the
 * caller is responsible for vetted content; this component just renders.
 */
export interface SystemMessageProps {
  message: ThreadMessage;
}

export function SystemMessage({ message }: SystemMessageProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mx-auto"
    >
      <span
        role="status"
        className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        {message.content}
      </span>
    </motion.div>
  );
}
