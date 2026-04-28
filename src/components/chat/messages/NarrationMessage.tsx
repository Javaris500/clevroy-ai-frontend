"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ThreadMessage } from "@/stores/chat-store";

/**
 * `narration` message renderer (Clevroy_Chat_Surface.md §2.2).
 *
 * Roy's serif voice. Left-aligned, no bubble, Fraunces italic. The spec
 * calls for "text-muted-foreground first paint then settles to
 * text-foreground" — we paint at muted, then crossfade to full foreground
 * over ~600ms so the line lands quietly rather than appearing hard.
 *
 * One line per message. No timestamp. The wrapping `motion.div` carries the
 * fade-and-rise; the inner `<p>` carries the muted→foreground color crossfade.
 */
export interface NarrationMessageProps {
  message: ThreadMessage;
}

export function NarrationMessage({ message }: NarrationMessageProps) {
  const reduceMotion = useReducedMotion();
  const [settled, setSettled] = React.useState(reduceMotion === true);

  React.useEffect(() => {
    if (reduceMotion) {
      setSettled(true);
      return;
    }
    const id = window.setTimeout(() => setSettled(true), 280);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="mr-auto max-w-[80%]"
    >
      <p
        className={cn(
          "font-serif italic",
          // 18px / 28px — slightly larger than body, deliberately not as
          // big as `text-phase` (which is reserved for the welcome line).
          "text-[1.0625rem] leading-[1.6]",
          "transition-colors duration-[420ms] ease-out",
          settled ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {message.content}
      </p>
    </motion.div>
  );
}
