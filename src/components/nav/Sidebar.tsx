"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Clapperboard,
  FolderOpen,
  Keyboard,
  LayoutTemplate,
  Library,
  MessageSquare,
  Settings,
  Sparkles,
  UserSquare,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSeenFilms } from "@/components/film-card";
import { useRecentFilms } from "@/hooks/use-films";
import { isFilmInProgress } from "@/types/film";
import { navLinks, sidebar as sidebarCopy, type NavLinkKey } from "@/lib/copy";
import { cn } from "@/lib/utils";

import { FilmBalanceBadge } from "./FilmBalanceBadge";
import { ProfileChip } from "./ProfileChip";
import { useCapacitorBackButton } from "./use-capacitor-back-button";

const ICON_STROKE = 1.5;
const ICON_SIZE = 20;

type NavItem = {
  key: NavLinkKey | "templates" | "library";
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Primary nav items in the locked Design_System §5 order.
 *
 * Audit 2026-04-28 #12: under Shape B, /home and /create are the same chat
 * surface, so the duplicate Home item is dropped — the wordmark above
 * carries the home affordance, and Create ("New film") routes to /home
 * directly. The first/last/aiTwin/settings entries come from `navLinks`
 * so the rail stays in lockstep with BottomTabBar.
 *
 * Templates + Library are sidebar-only additions — the bottom tab bar
 * keeps its locked 5-slot order, but a desktop rail has the room to
 * surface secondary destinations.
 *
 * TODO(routes): /templates and /library have no app/ pages today, so the
 * rows 404 on click. Wire to real routes when those surfaces ship, or
 * drop the entries.
 */
const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "create", ...navLinks.create, icon: Clapperboard },
  { key: "templates", label: sidebarCopy.templatesLabel, href: sidebarCopy.templatesHref, icon: LayoutTemplate },
  { key: "projects", ...navLinks.projects, icon: FolderOpen },
  { key: "library", label: sidebarCopy.libraryLabel, href: sidebarCopy.libraryHref, icon: Library },
  { key: "aiTwin", ...navLinks.aiTwin, icon: UserSquare },
  { key: "settings", ...navLinks.settings, icon: Settings },
];

function isActiveHref(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * AppSidebar — Clevroy's primary navigation on desktop and tablet.
 *
 * Composition follows shadcn's sidebar-07 pattern: a single <Sidebar
 * variant="inset"> mounted as a child of <RoundedShell> (which itself wraps
 * <SidebarProvider>). Roving focus (CC-4) on the primary menu — Up/Down
 * jump between items, Home/End to first/last.
 *
 * The footer slot renders <FilmBalanceBadge /> + <ProfileChip /> + a
 * Clevroy wordmark (in the header) that returns to /home.
 */
export interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();

  // Capacitor §3 — Android hardware back-button → pop the route stack.
  useCapacitorBackButton();

  const activeIndex = React.useMemo(() => {
    const idx = NAV_ITEMS.findIndex((item) => isActiveHref(pathname, item.href));
    return idx === -1 ? 0 : idx;
  }, [pathname]);

  const menuRef = React.useRef<HTMLUListElement>(null);

  function focusItem(index: number) {
    const list = menuRef.current;
    if (!list) return;
    const buttons = list.querySelectorAll<HTMLElement>('[data-nav-item="true"]');
    const target = buttons[index];
    if (target) target.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    const list = menuRef.current;
    if (!list) return;
    const buttons = Array.from(
      list.querySelectorAll<HTMLElement>('[data-nav-item="true"]'),
    );
    if (buttons.length === 0) return;
    const currentIndex = buttons.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    switch (event.key) {
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % buttons.length;
        break;
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = buttons.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    focusItem(nextIndex);
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className={className}>
      <SidebarHeader className="px-3 py-3 group-data-[collapsible=icon]:px-2">
        {/* Header layout flips on collapse:
              - expanded: wordmark on the left, trigger on the right
              - collapsed: wordmark hides, trigger centers in the rail
            so the icon-rail still has a discoverable expand affordance
            (audit 2026-04-28 #11). The wordmark Link keeps its
            screen-reader name (`sidebarCopy.wordmarkAria`) for the
            expanded state. */}
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/home"
            aria-label={sidebarCopy.wordmarkAria}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-1 py-1 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "group-data-[collapsible=icon]:hidden",
            )}
          >
            <span
              aria-hidden="true"
              className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <span className="block size-2 rounded-full bg-primary-foreground/90" />
            </span>
            <span className="text-h3 font-semibold tracking-[0.02em] text-foreground">
              Clevroy
            </span>
          </Link>
          <SidebarTrigger
            aria-label={sidebarCopy.toggleAria}
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          />
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu
              ref={menuRef}
              role="menu"
              aria-label="Primary"
              onKeyDown={onKeyDown}
            >
              {NAV_ITEMS.map((item, index) => {
                const active = index === activeIndex;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="h-11"
                    >
                      <Link
                        href={item.href}
                        role="menuitem"
                        data-nav-item="true"
                        tabIndex={active ? 0 : -1}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon
                          aria-hidden="true"
                          width={ICON_SIZE}
                          height={ICON_SIZE}
                          strokeWidth={ICON_STROKE}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <RecentFilmsGroup />
        <ResourcesGroup />
      </SidebarContent>

      <SidebarFooter className="gap-1.5 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:p-1.5">
        <FilmBalanceBadge className="w-full justify-start group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center" />
        <ProfileChip />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/**
 * Resources group — Feedback + Documentation. Visible in both expanded and
 * collapsed (icon) modes so the rail stays informationally dense rather
 * than ending in a tall empty stretch above the footer. Labels collapse
 * to icon-only via the shadcn primitive's built-in `group-data-[collapsible=icon]`
 * rules; the SidebarMenuButton tooltips surface the labels on hover.
 */
function ResourcesGroup() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{sidebarCopy.resourcesLabel}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* TODO(routes): /changelog has no app page yet. */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="sm"
              tooltip={sidebarCopy.whatsNewLabel}
              className="text-muted-foreground"
            >
              <Link href={sidebarCopy.whatsNewHref}>
                <Sparkles
                  aria-hidden="true"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                />
                <span>{sidebarCopy.whatsNewLabel}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="sm"
              tooltip={sidebarCopy.feedbackLabel}
              className="text-muted-foreground"
            >
              <a href={sidebarCopy.feedbackHref}>
                <MessageSquare
                  aria-hidden="true"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                />
                <span>{sidebarCopy.feedbackLabel}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {/* TODO(routes): /docs has no app/docs page — the link 404s today.
                Update sidebarCopy.documentationHref to a real docs URL when
                one exists, or drop the item. */}
            <SidebarMenuButton
              asChild
              size="sm"
              tooltip={sidebarCopy.documentationLabel}
              className="text-muted-foreground"
            >
              <Link href={sidebarCopy.documentationHref}>
                <BookOpen
                  aria-hidden="true"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                />
                <span>{sidebarCopy.documentationLabel}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {/* TODO(routes): /docs/shortcuts has no page yet — wire to the
                real shortcut reference (or a Dialog) when one ships. */}
            <SidebarMenuButton
              asChild
              size="sm"
              tooltip={sidebarCopy.shortcutsLabel}
              className="text-muted-foreground"
            >
              <Link href={sidebarCopy.shortcutsHref}>
                <Keyboard
                  aria-hidden="true"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                />
                <span>{sidebarCopy.shortcutsLabel}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/**
 * Recent films collapsible group. Hidden when there are no films, while
 * loading, or in the collapsed icon rail (titles aren't legible at 64px).
 *
 * Audit 2026-04-28 #13 + #14: the in-flight film gets a primary-color pulse +
 * sr-only "Shooting" label on its row instead of the unseen "New" dot — the
 * indicator that previously sat on the Create button now lives where the
 * matching row already is, and the user gets a constant visual that
 * something is shooting (mitigates Risk 2 — dead-thread silence).
 */
function RecentFilmsGroup() {
  const { data: recent, isLoading } = useRecentFilms(5);
  const { isSeen } = useSeenFilms();

  if (isLoading) return null;
  if (!recent || recent.length === 0) return null;

  return (
    <Collapsible
      defaultOpen
      className="group/collapsible group-data-[collapsible=icon]:hidden"
    >
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center">
            {sidebarCopy.recentLabel}
            <ChevronDown
              aria-hidden="true"
              className="ml-auto size-4 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-data-[state=closed]/collapsible:-rotate-90"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {recent.map((film) => {
                const shooting = isFilmInProgress(film.state);
                const seen = isSeen(film.id);
                return (
                  <SidebarMenuItem key={film.id}>
                    <SidebarMenuButton asChild tooltip={film.title}>
                      <Link href={`/films/${film.id}`}>
                        <span className="truncate">{film.title}</span>
                        {shooting ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="ml-auto size-2 shrink-0 rounded-full bg-primary motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]"
                            />
                            <span className="sr-only">Shooting</span>
                          </>
                        ) : !seen ? (
                          <span
                            aria-label={sidebarCopy.recentNewAria}
                            className="ml-auto size-2 shrink-0 rounded-full bg-primary-soft"
                          />
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
