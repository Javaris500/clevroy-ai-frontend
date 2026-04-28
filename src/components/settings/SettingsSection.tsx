"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SettingsSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** When true, omit the top divider. Pass on the first section in a page. */
  flush?: boolean;
  /** Renders a soft destructive tint background. Used for "Delete account"
   *  and "Cancel subscription" sections. */
  destructive?: boolean;
  className?: string;
  /** Optional right-aligned content rendered next to the title (e.g.
   *  "Saved" indicator, action button). */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Single-shape section wrapper for every settings sub-route. A section is
 * a titled block with optional description and a body slot. Sections stack
 * vertically; each section after the first carries a top divider so the
 * surface reads as one continuous form instead of a bag of cards.
 */
export function SettingsSection({
  title,
  description,
  flush,
  destructive,
  headerAction,
  className,
  children,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "py-8",
        !flush && "border-t border-border",
        destructive && "rounded-xl border border-destructive/30 bg-destructive/[0.04] p-6",
        destructive && !flush && "border-t-destructive/30",
        className,
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-start justify-between gap-3",
          children ? "mb-6" : "",
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </header>
      {children ? <div className="space-y-6">{children}</div> : null}
    </section>
  );
}
