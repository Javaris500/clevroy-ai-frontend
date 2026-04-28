"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  HelpCircle,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/use-profile";
import { profileChip as copy } from "@/lib/copy";
import { useUIStore, type ThemePreference } from "@/stores/ui-store";
import type { Profile } from "@/types/api";

import { useHasInProgressFilm } from "./InProgressIndicator";

function initialsFor(profile: Profile | null): string {
  const name = profile?.display_name ?? profile?.first_name ?? "";
  const trimmed = name.trim();
  if (!trimmed) return "C";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase().slice(0, 2);
}

export interface ProfileChipProps {
  className?: string;
}

/**
 * Defect #7 (audit 2026-04-25). The sidebar-footer account chip is now a
 * shadcn `<SidebarMenuButton size="lg">` wrapping `<Avatar>` + name +
 * ChevronsUpDown — the canonical sidebar-07 ProfileChip composition. It
 * reads as a clickable chip rather than plain text, collapses to just
 * the avatar in the icon rail, and opens the same theme/help/sign-out
 * dropdown the previous trigger did.
 */
export function ProfileChip({ className }: ProfileChipProps) {
  const router = useRouter();
  const { profile, isLoading } = useProfile();
  const hasInProgress = useHasInProgressFilm();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { isMobile } = useSidebar();

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (isLoading) {
    return <ProfileChipSkeleton className={className} />;
  }

  const initials = initialsFor(profile);
  const visibleName = profile?.first_name?.trim() || profile?.display_name?.trim() || "Account";
  const avatarUrl = profile?.avatar_url ?? undefined;

  function actuallySignOut() {
    // TODO(routes): /sign-out is not yet implemented in app/. The button
    // currently lands on a 404. Wire to the real sign-out flow when auth ships.
    router.push("/sign-out");
  }

  function onSignOutClick(event: Event) {
    if (hasInProgress) {
      event.preventDefault();
      setConfirmOpen(true);
      return;
    }
    actuallySignOut();
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                aria-label={copy.triggerAria(profile?.first_name)}
                tooltip={visibleName}
                className={className}
              >
                <Avatar className="size-8 rounded-lg">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{visibleName}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" aria-hidden="true" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side={isMobile ? "bottom" : "top"}
              sideOffset={8}
              className="min-w-[14rem]"
            >
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                {copy.themeLabel}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as ThemePreference)}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun className="mr-2 size-4" aria-hidden="true" strokeWidth={1.5} />
                  {copy.themeOptions.light}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="mr-2 size-4" aria-hidden="true" strokeWidth={1.5} />
                  {copy.themeOptions.dark}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor className="mr-2 size-4" aria-hidden="true" strokeWidth={1.5} />
                  {copy.themeOptions.system}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              {/* TODO(routes): /settings/help has no page yet — clicking lands
                  on a 404. Wire to the real help surface when it ships. */}
              <DropdownMenuItem asChild>
                <Link href="/settings/help">
                  <HelpCircle className="mr-2 size-4" aria-hidden="true" strokeWidth={1.5} />
                  {copy.help}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onSignOutClick} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 size-4" aria-hidden="true" strokeWidth={1.5} />
                {copy.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={copy.signOutDuringGenerationTitle}
        body={copy.signOutDuringGenerationDescription}
        verbs="signOutDuringGeneration"
        destructive={false}
        onConfirm={() => {
          setConfirmOpen(false);
          actuallySignOut();
        }}
      />
    </>
  );
}

/**
 * Token-perfect skeleton for `<ProfileChip />`. Matches the lg-sized
 * SidebarMenuButton geometry (h-12, 32px square avatar, name slot) so
 * swapping it in during loading produces zero layout shift.
 */
export function ProfileChipSkeleton({ className }: ProfileChipProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          aria-hidden="true"
          className={
            "flex h-12 w-full items-center gap-2 rounded-md p-2" +
            (className ? ` ${className}` : "")
          }
        >
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
