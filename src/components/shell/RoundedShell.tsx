"use client";

import * as React from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export interface RoundedShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Initial open state for the shadcn sidebar context. Defaults open on desktop. */
  defaultSidebarOpen?: boolean;
}

/**
 * RoundedShell — Theme v2 + sidebar-07 composition.
 *
 * Outer chrome for every authenticated route. Composition rules:
 *   - Outer frame: `bg-sidebar` (Theme v2) full viewport.
 *   - 12px shell-gap inset on tablet+ (Design_System §4, Global_Design_Rules
 *     §8). On mobile (≤767px) the inset collapses to 0 so the main panel
 *     goes edge-to-edge. Iyo's BottomTabBar replaces the sidebar there.
 *   - Wraps children in shadcn's <SidebarProvider/> so Iyo's <Sidebar/> +
 *     <SidebarInset/> from sidebar-07 work without further setup. Iyo owns
 *     the sidebar content; this component owns the frame.
 *   - Auth screens, landing, onboarding routes opt OUT by simply not
 *     rendering RoundedShell — handled at the route-group layout level
 *     (app/(auth)/layout.tsx, app/(landing)/layout.tsx).
 *
 * Children are expected to be Iyo's `<AppSidebar />` followed by a
 * `<SidebarInset>` that holds the page (typical sidebar-07 shape):
 *
 *   <RoundedShell>
 *     <AppSidebar />
 *     <SidebarInset>
 *       <PagePanel title="Your Films">…</PagePanel>
 *     </SidebarInset>
 *   </RoundedShell>
 */
export function RoundedShell({
  defaultSidebarOpen = true,
  className,
  children,
  ...rest
}: RoundedShellProps) {
  return (
    <div
      className={cn(
        // Full-viewport shell frame in the v2 sidebar tone.
        "min-h-[100dvh] w-full bg-sidebar text-sidebar-foreground",
        // Flush on mobile; 12px inset on all sides at md+ so the inner panels
        // float inside the frame. Override per-route by wrapping with your
        // own padding utility before <RoundedShell>.
        "p-0 md:p-[var(--spacing-shell-gap)]",
        // Respect notched-device safe areas (Design_System §10.3).
        "pt-[max(0px,var(--spacing-safe-top))]",
        "pb-[max(0px,var(--spacing-safe-bottom))]",
        "pl-[max(0px,var(--spacing-safe-left))]",
        "pr-[max(0px,var(--spacing-safe-right))]",
        className
      )}
      {...rest}
    >
      <SidebarProvider
        defaultOpen={defaultSidebarOpen}
        className="min-h-[calc(100dvh-2*var(--spacing-shell-gap))] overflow-hidden md:rounded-lg md:border md:border-sidebar-border md:bg-card"
      >
        {children}
      </SidebarProvider>
    </div>
  );
}
