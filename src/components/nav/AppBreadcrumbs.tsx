"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

/**
 * Pathname-derived breadcrumb trail rendered at the top of every non-chat
 * (app) surface. Chat routes (/home, /create, /films/[id]) intentionally
 * skip the breadcrumb — those surfaces are headerless by design (CLAUDE.md
 * "Header decision 2026-04-28: Option A").
 *
 * Single-segment paths (/projects, /ai-twin, /settings) don't render either —
 * the page heading already says the same thing, so a one-item breadcrumb is
 * pure chrome. Breadcrumbs only appear once depth ≥ 2.
 *
 * Segment labels come from this file's `LABELS` table. Add an entry when a
 * new route ships; unknown segments fall back to a Title-Cased version of
 * the slug so a freshly added /trash route still reads sensibly.
 */
const LABELS: Record<string, string> = {
  projects: "Projects",
  templates: "Templates",
  library: "Library",
  "ai-twin": "AI Twin",
  settings: "Settings",
  account: "Account",
  billing: "Billing",
  preferences: "Preferences",
  notifications: "Notifications",
  developer: "Developer",
  about: "About",
  changelog: "What's new",
  docs: "Documentation",
  shortcuts: "Keyboard shortcuts",
  films: "Films",
};

const HIDDEN_ROOTS = new Set(["home", "create", "films"]);

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((p) => (p.length === 0 ? p : p[0]!.toUpperCase() + p.slice(1)))
    .join(" ");
}

function labelFor(segment: string, isDynamic: boolean): string {
  if (isDynamic) {
    // /films/[id] is suppressed via HIDDEN_ROOTS, so the only dynamic ids
    // that reach here are sub-routes we haven't hardcoded. Surface the slug
    // verbatim — users will recognize their own ID when they see it.
    return segment;
  }
  return LABELS[segment] ?? titleCase(segment);
}

export interface AppBreadcrumbsProps {
  className?: string;
}

export function AppBreadcrumbs({ className }: AppBreadcrumbsProps) {
  const pathname = usePathname();

  const segments = React.useMemo(() => {
    if (!pathname) return [];
    return pathname.split("/").filter(Boolean);
  }, [pathname]);

  if (segments.length === 0) return null;
  if (HIDDEN_ROOTS.has(segments[0]!)) return null;
  if (segments.length < 2) return null;

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = "/" + segments.slice(0, index + 1).join("/");
          // Treat any segment that doesn't have a known label and isn't a
          // recognized parent route as a "dynamic" id — it'll render as raw
          // slug rather than title-cased English.
          const isDynamic = !LABELS[segment] && /^[a-f0-9-]{8,}$/i.test(segment);
          const label = labelFor(segment, isDynamic);

          return (
            <React.Fragment key={href}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="truncate">
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
