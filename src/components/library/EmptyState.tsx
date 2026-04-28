"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface LibraryEmptyStateProps {
  /** Fraunces serif phase line — the cinematic empty headline. */
  headline: React.ReactNode;
  /** Plain-language description below the headline. */
  description?: React.ReactNode;
  /** Optional CTA — internal route or arbitrary handler. */
  cta?: { label: string; href?: string; onClick?: () => void };
  /** Render-prop slot for surface-specific content (e.g. drag-drop zone). */
  children?: React.ReactNode;
  className?: string;
}

export function LibraryEmptyState({
  headline,
  description,
  cta,
  children,
  className,
}: LibraryEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center",
        className,
      )}
    >
      <p className="font-serif text-2xl italic text-foreground">{headline}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {cta ? (
        cta.href ? (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {cta.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={cta.onClick}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {cta.label}
          </button>
        )
      ) : null}
      {children}
    </div>
  );
}
