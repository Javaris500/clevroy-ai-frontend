"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { AppBreadcrumbs } from "@/components/nav/AppBreadcrumbs";
import { AppSidebar } from "@/components/nav/Sidebar";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { ProfileProvider } from "@/components/providers/profile-provider";
import { RoundedShell } from "@/components/shell/RoundedShell";
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsTablet } from "@/hooks/use-tablet";
import { cn } from "@/lib/utils";

/**
 * Authenticated app shell — wraps every (app) route in <RoundedShell />
 * with shadcn's sidebar-07 composition: <SidebarProvider> wraps a
 * <Sidebar variant="inset" collapsible="icon"> + <SidebarInset>.
 *
 * Defects #3 + #4 (audit 2026-04-25). The previous layout rendered a
 * sticky top header inside SidebarInset that hosted a SidebarTrigger
 * and a breadcrumb — that's the chrome the audit flagged as a "floating
 * trigger" + "orphan avatar". Both are gone. The SidebarTrigger now
 * lives inside <SidebarHeader> (see src/components/nav/Sidebar.tsx) and
 * the page content reaches the top edge directly. Pages that need a
 * sticky title bar bring their own.
 *
 * Chat surface (Clevroy_Chat_Surface.md D3): /create and /films/[id]
 * are the same persistent thread. The chat input owns the bottom edge,
 * so the BottomTabBar hides on both routes.
 *
 * Header decision (2026-04-28): Option A — no header chrome on /home or
 * any chat route. The cinematic centered welcome line is the de-facto
 * title; a horizontal banner above it dilutes the centering. The mobile
 * SidebarTrigger row stays because mobile users need a way to reach the
 * sidebar Sheet, but on chat routes it goes border-less + transparent so
 * it floats as a single 44×44 affordance rather than reading as a header.
 */
const ROUTES_HIDE_BOTTOM_BAR: ReadonlyArray<string> = ["/home", "/create", "/films"];
const ROUTES_NO_HEADER: ReadonlyArray<string> = ["/home", "/create", "/films"];

function matchesRoute(
  pathname: string | null,
  routes: ReadonlyArray<string>,
): boolean {
  if (!pathname) return false;
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function TabletDefault() {
  const isTablet = useIsTablet();
  const { setOpen } = useSidebar();
  const appliedRef = React.useRef(false);

  React.useEffect(() => {
    if (isTablet && !appliedRef.current) {
      appliedRef.current = true;
      setOpen(false);
    }
  }, [isTablet, setOpen]);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideBottomBar = matchesRoute(pathname, ROUTES_HIDE_BOTTOM_BAR);
  const noHeader = matchesRoute(pathname, ROUTES_NO_HEADER);

  return (
    <RoundedShell>
      <ProfileProvider>
        <TabletDefault />
        <AppSidebar />
        <SidebarInset
          data-app-inset="true"
          className={cn(
            "flex min-h-svh flex-1 flex-col bg-background",
            hideBottomBar
              ? "pb-[var(--spacing-safe-bottom)]"
              : "pb-[calc(72px+var(--spacing-safe-bottom))] md:pb-0",
          )}
        >
          {/* Top-of-inset header. Two shapes:
              - chat routes (/home, /create, /films): mobile-only floating
                SidebarTrigger, no border/bg (Header Option A 2026-04-28).
                Hidden ≥ md so the cinematic welcome reaches the top edge.
              - non-chat routes: sticky banner hosting the mobile trigger +
                pathname-derived breadcrumb. The breadcrumb suppresses
                itself for depth-1 paths (AppBreadcrumbs.tsx), so /projects
                still reads as a single chrome-light row. */}
          {noHeader ? (
            <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 bg-transparent px-3 md:hidden">
              <SidebarTrigger className="size-9" />
            </header>
          ) : (
            <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border bg-background px-3 md:px-6">
              <SidebarTrigger className="size-9 md:hidden" />
              <AppBreadcrumbs />
            </header>
          )}

          <div className="flex w-full flex-1 flex-col">{children}</div>
        </SidebarInset>
        <BottomTabBar hidden={hideBottomBar} />
      </ProfileProvider>
    </RoundedShell>
  );
}
