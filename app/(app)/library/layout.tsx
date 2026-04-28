"use client";

// Library shell — five sub-route tabs that mirror the /settings pattern.
// Tab triggers carry a count badge per slice; horizontal scroll on mobile.

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PagePanel } from "@/components/shell/PagePanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { library } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/stores/library-store";

const TABS = [
  { href: "/library/templates", labelKey: "templates" as const },
  { href: "/library/characters", labelKey: "characters" as const },
  { href: "/library/styles", labelKey: "styles" as const },
  { href: "/library/references", labelKey: "references" as const },
  { href: "/library/drafts", labelKey: "drafts" as const },
];

type TabHref = (typeof TABS)[number]["href"];

function TabLabel({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <span
        className={cn(
          "min-w-5 rounded-full px-1.5 py-0.5 text-center font-mono text-[10px] tracking-wider",
          count > 0
            ? "bg-primary-soft text-primary"
            : "bg-muted text-muted-foreground",
        )}
        aria-label={`${count} items`}
      >
        {count}
      </span>
    </span>
  );
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const counts = useLibraryStore((s) => ({
    templates: s.savedTemplateIds.length,
    characters: s.characters.length + 1, // +1 for the implicit "You" tile
    styles: s.savedStyles.length,
    references: s.references.length,
    drafts: s.drafts.length,
  }));

  const active: TabHref =
    TABS.find((t) => pathname?.startsWith(t.href))?.href
    ?? "/library/templates";

  return (
    <PagePanel title={library.pageTitle} subline={library.subline}>
      <Tabs value={active} className="w-full">
        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            aria-label={library.tabsAria}
            className="flex h-auto w-max gap-1 rounded-full bg-muted/60 p-1"
          >
            {TABS.map((t) => (
              <TabsTrigger
                key={t.href}
                value={t.href}
                asChild
                className="min-h-9 rounded-full px-3 py-1.5 text-sm"
              >
                <Link href={t.href}>
                  <TabLabel
                    label={library.tabs[t.labelKey]}
                    count={counts[t.labelKey]}
                  />
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6 min-w-0">{children}</div>
      </Tabs>
    </PagePanel>
  );
}
