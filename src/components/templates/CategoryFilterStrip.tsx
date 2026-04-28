"use client";

// Category filter chips + search input. Sticky-top under the page header so
// the filter stays in reach as the grid scrolls. Reads + writes URL search
// params (`?cat=…&q=…`) so filters survive refreshes and are shareable.
//
// Mobile: search renders above the chip strip; both are within the same
// sticky band. Chip strip horizontally scrolls on overflow.

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TEMPLATES, type TemplateCategory } from "@/lib/templates/data";
import { templates as copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

const CATEGORIES: ReadonlyArray<TemplateCategory | "all"> = [
  "all",
  "drama",
  "comedy",
  "documentary",
  "horror",
  "romance",
  "trailer",
  "short",
  "music",
];

function countFor(category: TemplateCategory | "all"): number {
  if (category === "all") return TEMPLATES.length;
  return TEMPLATES.filter((t) => t.category === category).length;
}

export interface CategoryFilterStripProps {
  className?: string;
}

export function CategoryFilterStrip({ className }: CategoryFilterStripProps) {
  const router = useRouter();
  const params = useSearchParams();
  const cat = (params.get("cat") as TemplateCategory | "all" | null) ?? "all";
  const q = params.get("q") ?? "";
  const [searchValue, setSearchValue] = React.useState(q);

  // Keep local input value in sync with URL when the URL changes from
  // outside (browser back/forward).
  React.useEffect(() => {
    setSearchValue(q);
  }, [q]);

  function setCategory(next: string) {
    if (!next) return;
    const sp = new URLSearchParams(params.toString());
    if (next === "all") sp.delete("cat");
    else sp.set("cat", next);
    const qs = sp.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  function commitSearch(value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value.trim().length === 0) sp.delete("q");
    else sp.set("q", value.trim());
    const qs = sp.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  // Live filter as the user types — fixture catalogue is small enough that
  // the grid re-renders cheaply.
  React.useEffect(() => {
    const id = window.setTimeout(() => commitSearch(searchValue), 80);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <div
      className={cn(
        "sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Chip strip — horizontal scroll on overflow. */}
      <ToggleGroup
        type="single"
        value={cat}
        onValueChange={setCategory}
        aria-label="Filter by category"
        className="flex w-full items-center gap-1 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CATEGORIES.map((c) => {
          const label = c === "all" ? copy.filter.all : copy.filter[c];
          const count = countFor(c);
          return (
            <ToggleGroupItem
              key={c}
              value={c}
              size="sm"
              className="h-9 shrink-0 rounded-full px-3 text-xs font-medium"
            >
              <span>{label}</span>
              <span className="ml-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                · {count}
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {/* Search — full-width on mobile, fixed-width on desktop. */}
      <div className="relative w-full sm:w-72">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchPlaceholder}
          className="h-9 pl-9 pr-9"
        />
        {searchValue.length > 0 ? (
          <button
            type="button"
            onClick={() => setSearchValue("")}
            aria-label={copy.clearSearch}
            className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
