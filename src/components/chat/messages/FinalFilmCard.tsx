"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { ThreadMessage } from "@/stores/chat-store";

import { AssetOverflow } from "./AssetOverflow";

/**
 * `asset/final_film` renderer (Clevroy_Chat_Surface.md §2.3 + §3 Phase 6).
 *
 * The complete film poster. 2:3 aspect, title in Fraunces, single
 * `<Button size="lg">Watch your film</Button>` beneath. Tapping routes to
 * `/films/[id]?play=true` so the existing /films/[id] route can decide
 * between in-page playback and a modal player.
 *
 * Three-dot overflow exposes "Take it home" / "Keep it" / "Delete it" —
 * all locked Brand Guide §5.4 verbs.
 */
export interface FinalFilmCardProps {
  message: ThreadMessage;
  /** Used to build the watch link. Falls back to `message.filmId`. */
  filmId?: string;
  onTakeItHome?: () => void;
  onKeepIt?: () => void;
  onDeleteIt?: () => void;
}

export function FinalFilmCard({
  message,
  filmId,
  onTakeItHome,
  onKeepIt,
  onDeleteIt,
}: FinalFilmCardProps) {
  const reduceMotion = useReducedMotion();
  const meta = message.metadata ?? {};
  const posterUrl = typeof meta.posterUrl === "string" ? meta.posterUrl : "";
  const title = typeof meta.title === "string" ? meta.title : null;
  const id = filmId ?? message.filmId;
  const watchHref = `/films/${id}?play=true`;

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mr-auto w-full max-w-[24rem]"
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="aspect-[2/3] w-full overflow-hidden bg-black">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt={title ?? "Film poster"}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Poster
            </div>
          )}
        </div>
        <div className="absolute right-2 top-2">
          <AssetOverflow
            triggerAriaLabel="Film actions"
            className="bg-background/85 hover:bg-background"
            items={[
              {
                key: "take-it-home",
                label: "Take it home",
                onSelect: () => onTakeItHome?.(),
              },
              {
                key: "keep-it",
                label: "Keep it",
                onSelect: () => onKeepIt?.(),
              },
              {
                key: "delete-it",
                label: "Delete it",
                onSelect: () => onDeleteIt?.(),
                destructive: true,
              },
            ]}
          />
        </div>
      </div>
      <figcaption className="mt-3 flex flex-col items-start gap-3">
        {title ? (
          <h3 className="font-serif text-2xl font-semibold leading-tight text-foreground">
            {title}
          </h3>
        ) : null}
        <Button asChild size="lg" className="self-stretch sm:self-auto">
          <Link href={watchHref}>Watch your film</Link>
        </Button>
      </figcaption>
    </motion.figure>
  );
}
