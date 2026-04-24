"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export interface RoundedShellProps {
  /** The left sidebar panel (desktop/tablet only). Hidden on mobile. */
  sidebar: React.ReactNode;
  /** The main content panel. */
  children: React.ReactNode;
  /** The mobile bottom tab bar. Rendered below the main panel on ≤767px. */
  bottomBar?: React.ReactNode;
  /** Optional className on the outer shell frame. */
  className?: string;
}

/**
 * The rounded-shell layout primitive — Design System §4.
 *
 * Anatomy:
 *   - Outer shell frame (bg-shell) with 12px --spacing-shell-gap on all sides
 *   - Sidebar panel (12px radius) pinned on desktop (240px) or collapsed on tablet (64px)
 *   - Main content panel (12px radius) filling the rest
 *   - 12px gap between sidebar and main panel
 *
 * Breakpoints (§4.3, §10.1):
 *   - ≥1024px (lg): sidebar pinned full width, controlled by store.sidebarCollapsed
 *   - 768–1023px (md): sidebar defaults collapsed to 64px; user can expand
 *   - ≤767px: sidebar hidden entirely; bottomBar replaces it; shell-gap → 0;
 *     main panel goes edge-to-edge
 *
 * Mobile uses 100dvh to absorb collapsing browser chrome without layout shift
 * (§10.3).
 */
export function RoundedShell({
  sidebar,
  children,
  bottomBar,
  className
}: RoundedShellProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div
      className={cn(
        // Shell frame — darkest surface in dark, warm cream in light.
        "flex min-h-[100dvh] w-full bg-[var(--color-shell)]",
        // Flush on mobile; 12px inset on tablet and up (§4.3).
        "p-0 md:p-[var(--spacing-shell-gap)]",
        // Respect safe-area insets on notched devices (§10.3).
        "pt-[max(0px,var(--spacing-safe-top))] pb-[max(0px,var(--spacing-safe-bottom))] pl-[max(0px,var(--spacing-safe-left))] pr-[max(0px,var(--spacing-safe-right))]",
        className
      )}
    >
      <div className="flex w-full flex-col md:flex-row md:gap-[var(--spacing-shell-gap)]">
        {/* Sidebar — desktop/tablet only. Mobile uses the bottom tab bar. */}
        <aside
          aria-label="Primary"
          className={cn(
            "hidden md:flex md:flex-col md:shrink-0",
            // 12px panel radius, card background, hairline border (§4.1).
            "md:rounded-[var(--radius-lg)] md:border md:border-[var(--color-border)] md:bg-[var(--color-card)] md:text-[var(--color-card-foreground)]",
            // Collapsed → 64px icon rail. Expanded → 240px.
            // Tablet defaults to collapsed per §4.3; store.sidebarCollapsed
            // drives desktop behavior.
            collapsed ? "md:w-16 lg:w-16" : "md:w-16 lg:w-60",
            // Width transition — sidebar collapse/expand is 300ms (§14).
            "md:transition-[width] md:duration-[var(--duration-slow)] md:ease-[var(--ease-in-out)]",
            "md:overflow-hidden"
          )}
        >
          {sidebar}
        </aside>

        {/* Main content panel. */}
        <main
          className={cn(
            "flex min-h-[100dvh] flex-1 flex-col md:min-h-0",
            // Mobile: edge-to-edge, no radius, no border (§4.3).
            // Desktop/tablet: 12px radius, card background.
            "bg-[var(--color-background)] text-[var(--color-foreground)]",
            "md:rounded-[var(--radius-lg)] md:border md:border-[var(--color-border)] md:bg-[var(--color-card)] md:text-[var(--color-card-foreground)]",
            "md:overflow-hidden"
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar. Desktop/tablet navigate via the sidebar. */}
      {bottomBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">{bottomBar}</div>
      ) : null}
    </div>
  );
}
