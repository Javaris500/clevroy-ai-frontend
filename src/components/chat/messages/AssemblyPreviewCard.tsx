"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { ThreadMessage } from "@/stores/chat-store";

/**
 * `asset/assembly_preview` renderer (Clevroy_Chat_Surface.md §2.3 + §3
 * Phase 5 "save-the-surprise" rule).
 *
 * Phase 5 surprise: a composing animation of the title sequence or final
 * color grade being built. The user has not seen this asset before — it
 * lands once, here. We render the underlying image with a one-shot
 * blur-to-focus + brightness lift so the reveal feels developed rather
 * than dropped in.
 *
 * No three-dot menu — there's nothing actionable about an in-flight
 * assembly preview, and the spec doesn't list overflow actions for this
 * type.
 */
export interface AssemblyPreviewCardProps {
  message: ThreadMessage;
}

export function AssemblyPreviewCard({ message }: AssemblyPreviewCardProps) {
  const reduceMotion = useReducedMotion();
  const meta = message.metadata ?? {};
  const imageUrl = typeof meta.imageUrl === "string" ? meta.imageUrl : "";

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="mr-auto w-full max-w-[36rem]"
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="aspect-video w-full overflow-hidden bg-black">
          {imageUrl ? (
            <motion.img
              src={imageUrl}
              alt="Assembly preview"
              className="size-full object-cover"
              initial={
                reduceMotion
                  ? { filter: "blur(0px) brightness(1)", opacity: 1 }
                  : { filter: "blur(14px) brightness(0.6)", opacity: 0.6 }
              }
              animate={{ filter: "blur(0px) brightness(1)", opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 1.6,
                ease: "easeOut",
              }}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Assembling…
            </div>
          )}
        </div>
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-background/85 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Assembling
          </span>
        </div>
      </div>
      <figcaption className="mt-2 text-sm text-muted-foreground">
        {message.content || "Cutting your first take."}
      </figcaption>
    </motion.figure>
  );
}
