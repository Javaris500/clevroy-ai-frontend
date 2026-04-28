"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Shared three-dot overflow menu for asset cards (Clevroy_Chat_Surface.md
 * §2.3). 44px touch target. Items are caller-defined; this component owns
 * the trigger styling and dropdown chrome.
 *
 * Layer 3 stops at presentation — the actions are no-op `onSelect` handlers
 * that callers can wire to real mutations in Layer 4/5 (reshoot, take it
 * home, delete). For now the menu items render and dispatch through to the
 * caller's handlers, which can `console.warn` until the real flows ship.
 */
export interface AssetOverflowItem {
  /** Stable key, used by React. */
  key: string;
  /** Visible label. Brand verbs only. */
  label: string;
  /** Called when the item is selected. */
  onSelect: () => void;
  /** Subtly tints the item destructive. Use for "Delete it". */
  destructive?: boolean;
}

export interface AssetOverflowProps {
  items: ReadonlyArray<AssetOverflowItem>;
  /** Visible label for the trigger button — read by screen readers. */
  triggerAriaLabel: string;
  className?: string;
}

export function AssetOverflow({
  items,
  triggerAriaLabel,
  className,
}: AssetOverflowProps) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={triggerAriaLabel}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full",
            "text-muted-foreground transition-colors",
            "hover:bg-background/80 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
        >
          <MoreHorizontal
            className="size-4"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[12rem]">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onSelect={item.onSelect}
            className={cn(
              item.destructive ? "text-destructive focus:text-destructive" : "",
            )}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
