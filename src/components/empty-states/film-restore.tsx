"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { emptyStates } from "@/lib/copy";

type FilmRestoreProps = {
  /** ISO 8601 timestamp from films.deleted_at. */
  deletedAt: string;
  /** ISO 8601 timestamp from films.permanent_delete_at (deleted_at + 30d). */
  permanentDeleteAt: string;
  onRestore: () => void;
  /** True while the restore mutation is in-flight. */
  pending?: boolean;
};

// EC-N8: When a user deep-links to one of their own soft-deleted films within
// the 30-day recovery window, we tell them when they deleted it and when it
// will be permanently purged, with a Restore CTA. Outside the window, this
// branch is unreachable — Stratum returns the same shape as a 404 and we
// render <FilmNotFound /> instead. Nemi composes this inside [id]/page.tsx.

export function FilmRestore({
  deletedAt,
  permanentDeleteAt,
  onRestore,
  pending = false,
}: FilmRestoreProps) {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(d);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-foreground">
          {emptyStates.filmRestore.headline(fmt(deletedAt))}
        </h2>
        <p className="text-body text-muted-foreground">
          {emptyStates.filmRestore.description(fmt(permanentDeleteAt))}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onRestore} disabled={pending}>
          {emptyStates.filmRestore.restoreCta}
        </Button>
        <Button variant="ghost" asChild disabled={pending}>
          <Link href="/projects">{emptyStates.filmNotFound.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
