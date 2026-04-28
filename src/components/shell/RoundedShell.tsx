"use client";

import * as React from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export interface RoundedShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Initial open state for the shadcn sidebar context. Defaults open on desktop. */
  defaultSidebarOpen?: boolean;
}

/**
 * RoundedShell — edge-to-edge sidebar-07 composition.
 *
 * Outer chrome for every authenticated route. The shell paints
 * `bg-background` directly to the viewport edges; there is no outer
 * frame, no rounded inset, and no cream "projection booth" surround.
 * The only seam in the layout is the 1px border between the sidebar
 * panel and the inset, owned by shadcn's <SidebarProvider>.
 *
 * Children are expected to be `<AppSidebar />` followed by a
 * `<SidebarInset>` that holds the page (typical sidebar-07 shape):
 *
 *   <RoundedShell>
 *     <AppSidebar />
 *     <SidebarInset>{children}</SidebarInset>
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
        "min-h-[100dvh] w-full bg-background text-foreground",
        "pt-[max(0px,var(--spacing-safe-top))]",
        "pb-[max(0px,var(--spacing-safe-bottom))]",
        "pl-[max(0px,var(--spacing-safe-left))]",
        "pr-[max(0px,var(--spacing-safe-right))]",
        className
      )}
      {...rest}
    >
      <SidebarProvider defaultOpen={defaultSidebarOpen} className="min-h-[100dvh]">
        {children}
      </SidebarProvider>
    </div>
  );
}
