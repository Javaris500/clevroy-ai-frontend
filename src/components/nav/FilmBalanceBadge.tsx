"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Film } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/use-profile";
import { filmBalanceBadge as copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

/**
 * Renders the user's remaining films balance as a clickable badge that links
 * to the Buy-more-films surface (EC-N2). Sits in the Sidebar footer just
 * above the ProfileChip per Design_System §5.
 *
 * - Uses Brand_Guide §5.4 "films" language verbatim.
 * - When `films_remaining` floors to 0, the badge shifts to a primary-soft
 *   background and pulses to draw attention (EC-N2). The pulse is gated on
 *   `motion-safe:` so users with prefers-reduced-motion never see it (CC-2).
 * - In the collapsed icon rail (`useSidebar().state === "collapsed"`), the
 *   badge auto-renders the compact variant — a 44×44 square with just the
 *   integer count. A Tooltip provides the full label on hover/focus so the
 *   surface stays self-describing.
 * - NUMERIC(8,2) string is preserved end-to-end. We `parseFloat` only at the
 *   leaf for display rounding (Math.floor) — the canonical value never
 *   leaves the store as a number.
 */
export interface FilmBalanceBadgeProps {
  className?: string;
  /** Force the compact variant. Normally inferred from sidebar state. */
  compact?: boolean;
}

export function FilmBalanceBadge({ className, compact: compactProp }: FilmBalanceBadgeProps) {
  const { profile, isLoading } = useProfile();
  const { state, isMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const compact = compactProp ?? isCollapsed;

  if (isLoading) {
    return <FilmBalanceBadgeSkeleton className={className} compact={compact} />;
  }

  const remainingString = profile?.films_remaining ?? "0";
  const remainingInt = Math.max(0, Math.floor(parseFloat(remainingString) || 0));
  const isEmpty = remainingInt === 0;

  const label = isEmpty ? copy.buyMoreFilms : copy.filmsLeft(remainingInt);
  const ariaLabel = isEmpty ? copy.buyMoreAria : label;

  const badge = (
    <Link
      href="/settings/billing"
      aria-label={ariaLabel}
      className={cn(
        "group/balance inline-flex items-center gap-2 rounded-md text-body-md font-medium transition-colors",
        "h-11 min-h-11", // 44px touch target — Design_System §10.2.
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isEmpty
          ? "border border-primary/40 bg-primary-soft text-primary motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]"
          : "bg-sidebar-accent/40 text-sidebar-foreground hover:bg-sidebar-accent",
        compact ? "size-11 justify-center px-0" : "px-2.5",
        className,
      )}
    >
      {compact ? (
        <span aria-hidden="true" className="font-mono tabular-nums">
          {remainingInt}
        </span>
      ) : (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-md",
              isEmpty
                ? "bg-primary/15 text-primary"
                : "bg-sidebar-accent text-sidebar-foreground/80 group-hover/balance:text-sidebar-foreground",
            )}
          >
            <Film
              width={14}
              height={14}
              strokeWidth={1.75}
            />
          </span>
          <span className="flex-1 truncate tabular-nums">{label}</span>
          <ChevronRight
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 transition-transform",
              "text-sidebar-foreground/40 group-hover/balance:translate-x-0.5 group-hover/balance:text-sidebar-foreground/70",
              isEmpty && "text-primary/70 group-hover/balance:text-primary",
            )}
            strokeWidth={1.75}
          />
        </>
      )}
    </Link>
  );

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

/**
 * Token-perfect skeleton for `<FilmBalanceBadge />`. Matches the live
 * badge's outer dimensions so swapping it in during loading produces zero
 * layout shift.
 */
export function FilmBalanceBadgeSkeleton({
  className,
  compact = false,
}: FilmBalanceBadgeProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40",
        "h-11 min-h-11",
        compact ? "size-11 justify-center px-0" : "px-3",
        className,
      )}
    >
      <Skeleton className="size-4" />
      {!compact && <Skeleton className="h-4 w-20" />}
    </div>
  );
}
