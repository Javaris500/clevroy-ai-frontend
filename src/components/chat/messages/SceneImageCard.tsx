"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ThreadMessage } from "@/stores/chat-store";

import { AssetOverflow } from "./AssetOverflow";

/**
 * `asset/scene_image` renderer (Clevroy_Chat_Surface.md §2.3).
 *
 * Full-width inside the message column, no bubble, 12px radius. 16:9 aspect
 * via Tailwind `aspect-video`. Subtle ken-burns drift under
 * `prefers-reduced-motion: no-preference`. Caption beneath: scene number +
 * brief title in Inter `text-sm`.
 *
 * Three-dot overflow with "Reshoot this scene" + "View characters" (verbs
 * locked by Brand Guide §5.4 / sceneActions in copy.ts).
 */
export interface SceneImageCardProps {
  message: ThreadMessage;
  onReshoot?: (sceneId: string | undefined) => void;
  onViewCharacters?: () => void;
}

export function SceneImageCard({
  message,
  onReshoot,
  onViewCharacters,
}: SceneImageCardProps) {
  const reduceMotion = useReducedMotion();
  const meta = message.metadata ?? {};
  const sceneNumber =
    typeof meta.sceneNumber === "number" ? meta.sceneNumber : null;
  const sceneId = typeof meta.sceneId === "string" ? meta.sceneId : undefined;
  const imageUrl = typeof meta.imageUrl === "string" ? meta.imageUrl : "";

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="mr-auto w-full max-w-[36rem]"
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="aspect-video w-full overflow-hidden">
          {imageUrl ? (
            // Subtle ken-burns drift under no-preference. The motion-safe
            // variant collapses the keyframes to identity for reduced-motion.
            <motion.img
              src={imageUrl}
              alt={
                sceneNumber != null
                  ? `Scene ${sceneNumber}`
                  : "Scene still"
              }
              className="size-full object-cover"
              initial={reduceMotion ? { scale: 1 } : { scale: 1.04 }}
              animate={
                reduceMotion
                  ? { scale: 1 }
                  : { scale: [1.04, 1.0, 1.04] }
              }
              transition={{
                duration: 9,
                ease: "easeInOut",
                repeat: reduceMotion ? 0 : Infinity,
              }}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
              Scene still
            </div>
          )}
        </div>

        <div className="absolute right-2 top-2">
          <AssetOverflow
            triggerAriaLabel={
              sceneNumber != null
                ? `Scene ${sceneNumber} actions`
                : "Scene actions"
            }
            items={[
              {
                key: "reshoot",
                label: "Reshoot this scene",
                onSelect: () => onReshoot?.(sceneId),
              },
              {
                key: "characters",
                label: "View characters",
                onSelect: () => onViewCharacters?.(),
              },
            ]}
          />
        </div>
      </div>
      <figcaption
        className={cn(
          "mt-2 flex items-center gap-2 text-sm text-muted-foreground",
        )}
      >
        {sceneNumber != null ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            Scene {String(sceneNumber).padStart(2, "0")}
          </span>
        ) : null}
        {message.content ? (
          <span className="text-foreground/80">{message.content}</span>
        ) : null}
      </figcaption>
    </motion.figure>
  );
}
