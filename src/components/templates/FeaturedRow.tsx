"use client";

// Featured row at the top of /templates. Renders the 2–3 templates marked
// `featured: true` in the catalogue at lg size. Eyebrow above. Hidden if no
// featured templates exist (defensive — the fixture always has at least one).

import * as React from "react";

import { TEMPLATES } from "@/lib/templates/data";
import { templates as copy } from "@/lib/copy";

import { TemplateCard } from "./TemplateCard";

export interface FeaturedRowProps {
  onOpen: (id: string) => void;
}

export function FeaturedRow({ onOpen }: FeaturedRowProps) {
  const featured = React.useMemo(
    () => TEMPLATES.filter((t) => t.featured),
    [],
  );
  if (featured.length === 0) return null;

  return (
    <section aria-label={copy.featured.eyebrow} className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {copy.featured.eyebrow}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((t) => (
          <TemplateCard key={t.id} template={t} size="lg" onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
