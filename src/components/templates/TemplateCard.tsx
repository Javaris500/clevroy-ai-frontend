"use client";

// <TemplateCard /> — poster-art-first template tile. Hover desktop swaps the
// poster image for an autoplay-muted preview clip; mobile (coarse pointer)
// stays static. Click anywhere on the card body opens the detail sheet via
// the parent-supplied callback. The save toggle is its own 44×44 hit area
// at the top-right corner so saving doesn't open the sheet.

import * as React from "react";
import { Heart } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useLibraryStore } from "@/stores/library-store";
import { templates as copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

import type { Template } from "@/lib/templates/data";

export type TemplateCardSize = "md" | "lg";

export interface TemplateCardProps {
  template: Template;
  size?: TemplateCardSize;
  onOpen: (id: string) => void;
  className?: string;
}

function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return coarse;
}

function durationCaption(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

function categoryLabel(category: Template["category"]): string {
  return copy.filter[category];
}

export function TemplateCard({
  template,
  size = "md",
  onOpen,
  className,
}: TemplateCardProps) {
  const coarse = useIsCoarsePointer();
  const [hovered, setHovered] = React.useState(false);
  const isSaved = useLibraryStore((s) => s.isTemplateSaved(template.id));
  const saveTemplate = useLibraryStore((s) => s.saveTemplate);
  const unsaveTemplate = useLibraryStore((s) => s.unsaveTemplate);

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (isSaved) {
      unsaveTemplate(template.id);
    } else {
      saveTemplate(template.id);
    }
  }

  function handleSaveKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (isSaved) unsaveTemplate(template.id);
      else saveTemplate(template.id);
    }
  }

  function handleOpenKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(template.id);
    }
  }

  const showVideo = !coarse && hovered;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(template.id)}
      onKeyDown={handleOpenKey}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-150 ease-out",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        "active:translate-y-0 active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        size === "lg" ? "p-3.5" : "p-3",
        className,
      )}
    >
      {/* Poster wrapper — 2:3, full width of card. */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.poster_url}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-200",
            showVideo ? "opacity-0" : "opacity-100",
          )}
        />
        {showVideo ? (
          <video
            src={template.preview_url}
            poster={template.poster_url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}

        {/* Save heart, top-right, 44×44 hit area. */}
        <button
          type="button"
          onClick={handleSave}
          onKeyDown={handleSaveKey}
          aria-label={isSaved ? copy.card.unsaveAria : copy.card.saveAria}
          aria-pressed={isSaved}
          className={cn(
            "absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full",
            "bg-background/80 text-foreground/80 backdrop-blur-sm transition-colors",
            "hover:bg-background hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isSaved && "text-primary hover:text-primary",
          )}
        >
          <Heart
            className={cn("size-4", isSaved && "fill-current")}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Title + meta below poster — outside the poster frame so it stays
          legible across all backgrounds. */}
      <div className="flex flex-col gap-1 px-1 pb-1">
        <h3
          className={cn(
            "truncate font-serif font-semibold text-foreground",
            size === "lg" ? "text-lg" : "text-base",
          )}
        >
          {template.title}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {categoryLabel(template.category)} · {durationCaption(template.duration_seconds)}
        </p>
      </div>
    </Card>
  );
}
