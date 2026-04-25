import * as React from "react";

import { RoundedShell } from "@/components/shell/RoundedShell";
import { SidebarInset } from "@/components/ui/sidebar";

/**
 * Authenticated app shell — wraps every (app) route with RoundedShell +
 * Iyo's <AppSidebar />.
 *
 * When Iyo ships `src/components/nav/Sidebar.tsx`, replace the
 * `<SidebarPlaceholder />` import below with the real component. Until then
 * the placeholder reserves the same width so the layout reads correctly at
 * desktop / tablet / mobile breakpoints.
 *
 * Auth check note: when Stratum's auth helper lands, gate this layout on
 * a session check (redirect to /sign-in if missing). For MVP scaffolding
 * we assume authed.
 */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoundedShell>
      {/* Iyo will replace this import once nav/Sidebar.tsx exists. */}
      <SidebarPlaceholder />
      <SidebarInset className="bg-background">{children}</SidebarInset>
    </RoundedShell>
  );
}

/**
 * Placeholder until Iyo's Sidebar lands. Renders an empty sidebar of the
 * correct width so RoundedShell + SidebarInset compute the right layout.
 * Delete this once `<AppSidebar />` is wired up.
 */
function SidebarPlaceholder() {
  return (
    <aside
      data-placeholder="leia/sidebar-stub"
      aria-hidden="true"
      className="hidden h-full w-[16rem] shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col"
    >
      <div className="px-4 py-3 text-caption text-sidebar-foreground/60">
        Sidebar placeholder
      </div>
    </aside>
  );
}
