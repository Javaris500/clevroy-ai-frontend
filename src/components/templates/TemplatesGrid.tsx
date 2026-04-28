"use client";

// The poster-art grid below the featured row. Reads category + search from
// URL search params and applies a case-insensitive title filter. Empty
// states differentiate between "no search match" and "no category match"
// because they call for different recovery actions.

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TEMPLATES, type TemplateCategory } from "@/lib/templates/data";
import { templates as copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

import { TemplateCard } from "./TemplateCard";

export interface TemplatesGridProps {
  onOpen: (id: string) => void;
  className?: string;
}

export function TemplatesGrid({ onOpen, className }: TemplatesGridProps) {
  const params = useSearchParams();
  const router = useRouter();
  const cat = (params.get("cat") as TemplateCategory | "all" | null) ?? "all";
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const visible = React.useMemo(() => {
    let list: ReadonlyArray<typeof TEMPLATES[number]> = TEMPLATES;
    if (cat !== "all") list = list.filter((t) => t.category === cat);
    if (q.length > 0) {
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    return list;
  }, [cat, q]);

  function clearAll() {
    router.replace("?", { scroll: false });
  }

  if (visible.length === 0) {
    const isSearchEmpty = q.length > 0;
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center",
          className,
        )}
      >
        <p className="font-serif text-base text-foreground">
          {isSearchEmpty ? copy.emptyResults : copy.emptyCategory}
        </p>
        {isSearchEmpty ? (
          <button
            type="button"
            onClick={clearAll}
            className="mt-3 inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {copy.clearSearch}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {visible.map((t) => (
        <TemplateCard key={t.id} template={t} onOpen={onOpen} />
      ))}
    </div>
  );
}
