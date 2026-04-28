"use client";

// Settings shell — Design_System §7.7 + Layout_Enhancements A.15.
//
// Each <TabsTrigger> is a <Link> to its sub-route. Active value is derived
// from `usePathname()`. The shell adds:
//   - Last-saved indicator in the page header (reads last-saved-store).
//   - Per-tab dirty-state dot (reads last-saved-store.dirtyRoutes).
//   - Developer tab visibility gated behind useDevMode().

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PagePanel } from "@/components/shell/PagePanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDevMode } from "@/hooks/use-dev-mode";
import { formatRelative } from "@/lib/format-relative";
import { settings } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useLastSavedStore } from "@/stores/last-saved-store";

const SECTIONS = [
  { href: "/settings/account", labelKey: "account" },
  { href: "/settings/billing", labelKey: "billing" },
  { href: "/settings/preferences", labelKey: "preferences" },
  { href: "/settings/notifications", labelKey: "notifications" },
  { href: "/settings/developer", labelKey: "developer" },
  { href: "/settings/about", labelKey: "about" },
] as const;

type SectionHref = (typeof SECTIONS)[number]["href"];

function LastSavedIndicator() {
  const lastSavedAt = useLastSavedStore((s) => s.lastSavedAt);
  const [, force] = React.useReducer((n: number) => n + 1, 0);

  // Refresh the relative-time string every 30s so "5s ago" → "1m ago" without
  // a fresh save. Cheap; only mounted while on /settings.
  React.useEffect(() => {
    if (lastSavedAt === null) return;
    const id = window.setInterval(force, 30_000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  if (lastSavedAt === null) return null;
  const rel = formatRelative(lastSavedAt);
  return (
    <p
      className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {settings.lastSaved(rel)}
    </p>
  );
}

function TabLabel({ label, dirty }: { label: string; dirty: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      {dirty ? (
        <span
          aria-label={settings.dirtyDotAria}
          className="size-1.5 rounded-full bg-primary"
        />
      ) : null}
    </span>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dirtyRoutes = useLastSavedStore((s) => s.dirtyRoutes);
  const devMode = useDevMode();

  const visibleSections = React.useMemo(
    () => SECTIONS.filter((s) => s.href !== "/settings/developer" || devMode),
    [devMode],
  );

  const active: SectionHref =
    visibleSections.find((s) => pathname?.startsWith(s.href))?.href
    ?? "/settings/account";

  return (
    <PagePanel
      title={settings.pageTitle}
      subline={settings.subline}
      headerAction={<LastSavedIndicator />}
    >
      <Tabs value={active} className="w-full">
        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            aria-label={settings.pageTitle}
            className="flex h-auto w-max gap-1 rounded-full bg-muted/60 p-1"
          >
            {visibleSections.map((s) => {
              const dirty = dirtyRoutes.has(s.href);
              return (
                <TabsTrigger
                  key={s.href}
                  value={s.href}
                  asChild
                  className={cn(
                    "min-h-9 rounded-full px-3 py-1.5 text-sm",
                  )}
                >
                  <Link href={s.href}>
                    <TabLabel label={settings.nav[s.labelKey]} dirty={dirty} />
                  </Link>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mt-6 min-w-0">{children}</div>
      </Tabs>
    </PagePanel>
  );
}
