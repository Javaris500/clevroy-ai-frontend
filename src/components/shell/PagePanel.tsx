import * as React from "react";

import { cn } from "@/lib/utils";

export interface PagePanelProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Page title — rendered in the locked H1 style (Global_Design_Rules §2.1). */
  title?: React.ReactNode;
  /** Optional one-line subline below the title. Brand voice — keep it concrete. */
  subline?: React.ReactNode;
  /** Optional row content (chips, action button) rendered next to the title. */
  headerAction?: React.ReactNode;
  /** Drop the inner padding (e.g. when nesting full-bleed media). */
  flush?: boolean;
}

/**
 * The standard authenticated page container — Global_Design_Rules §1, §2.1.
 *
 * Every page that lives inside RoundedShell opens with this. It owns:
 *   - the title's H1 styling (no agent re-styles page titles)
 *   - the subline / muted line under the title
 *   - the cinematic gap between title block and content (`mt-8` = 32px,
 *     "Roomy" rhythm per Global_Design_Rules §4)
 *   - default 12px-radius card on top of the main panel surface
 *
 * If you need a chip or action button next to the title, pass it as
 * `headerAction`. For deeper subsection structure inside the page, use
 * <SectionHeader />.
 */
export function PagePanel({
  title,
  subline,
  headerAction,
  flush = false,
  className,
  children,
  ...rest
}: PagePanelProps) {
  return (
    <section
      className={cn(
        "rounded-lg bg-card text-card-foreground",
        flush ? "" : "p-6 md:p-8",
        className
      )}
      {...rest}
    >
      {(title || subline || headerAction) && (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            {title ? <h1 className="text-h1">{title}</h1> : null}
            {subline ? (
              <p className="text-body text-muted-foreground">{subline}</p>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </header>
      )}
      {children !== undefined && children !== null ? (
        <div className={cn(title || subline || headerAction ? "mt-8" : "")}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
