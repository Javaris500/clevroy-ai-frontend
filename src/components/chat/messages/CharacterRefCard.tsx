"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { CharacterRef, ThreadMessage } from "@/stores/chat-store";

import { AssetOverflow } from "./AssetOverflow";

/**
 * `asset/character_refs` renderer (Clevroy_Chat_Surface.md §2.3).
 *
 * Horizontal grid of character portraits. Each portrait fades in
 * stagger-style — 50ms per item, capped at 8 visible. Names beneath each
 * in `text-sm`.
 *
 * Three-dot overflow exposes "View all characters" — Layer 4/5 wires that
 * to a real surface.
 */
const STAGGER_MS = 50;
const VISIBLE_CAP = 8;

export interface CharacterRefCardProps {
  message: ThreadMessage;
  onViewAll?: () => void;
}

export function CharacterRefCard({
  message,
  onViewAll,
}: CharacterRefCardProps) {
  const reduceMotion = useReducedMotion();
  const characters: ReadonlyArray<CharacterRef> =
    message.metadata?.characters ?? [];
  const visible = characters.slice(0, VISIBLE_CAP);
  const overflowCount = Math.max(0, characters.length - VISIBLE_CAP);

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="mr-auto w-full max-w-[36rem]"
    >
      <div className="relative rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Cast
          </span>
          <AssetOverflow
            triggerAriaLabel="Cast actions"
            items={[
              {
                key: "view-all",
                label: "View all characters",
                onSelect: () => onViewAll?.(),
              },
            ]}
          />
        </div>
        <ul
          role="list"
          className="grid grid-cols-3 gap-3 sm:grid-cols-4"
        >
          {visible.map((c, i) => (
            <motion.li
              key={c.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.24,
                ease: "easeOut",
                delay: reduceMotion ? 0 : (i * STAGGER_MS) / 1000,
              }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="aspect-square w-full overflow-hidden rounded-full border border-border bg-muted">
                {c.portraitUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.portraitUrl}
                    alt={c.name}
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <span className="truncate text-center text-sm text-foreground">
                {c.name}
              </span>
            </motion.li>
          ))}
          {overflowCount > 0 ? (
            <li className="flex flex-col items-center gap-1.5">
              <div className="flex aspect-square w-full items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                +{overflowCount}
              </div>
              <span className="text-center text-sm text-muted-foreground">
                More
              </span>
            </li>
          ) : null}
        </ul>
      </div>
    </motion.figure>
  );
}
