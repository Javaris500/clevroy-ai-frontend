"use client";

// /library/templates — saved templates from /templates. Until the templates
// session merges its <TemplateCard> + data, render placeholder rows so the
// page remains exercised by Layer 5.

import * as React from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { LibraryEmptyState } from "@/components/library/EmptyState";
import { useLibraryStore } from "@/stores/library-store";
import { library } from "@/lib/copy";
import { cn } from "@/lib/utils";

export default function LibraryTemplatesPage() {
  const ids = useLibraryStore((s) => s.savedTemplateIds);
  const unsave = useLibraryStore((s) => s.unsaveTemplate);

  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return ids;
    const q = query.trim().toLowerCase();
    return ids.filter((id) => id.toLowerCase().includes(q));
  }, [ids, query]);

  if (ids.length === 0) {
    return (
      <LibraryEmptyState
        headline="Your saved templates land here."
        description={library.templates.empty}
        cta={{ label: library.templates.browseLink, href: "/templates" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder={library.templates.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-label={library.templates.searchPlaceholder}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matches.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((id) => (
            <li
              key={id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm",
              )}
            >
              <p className="truncate text-sm text-foreground">
                {library.templates.placeholderTitle(id)}
              </p>
              <button
                type="button"
                onClick={() => {
                  unsave(id);
                  toast.success(library.templateRemovedToast);
                }}
                aria-label={`${library.templates.remove} ${id}`}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
