import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** H2 text. */
  title: React.ReactNode;
  /** Optional muted subline under the title. */
  subline?: React.ReactNode;
  /** Optional right-aligned action — typically a Button. */
  action?: React.ReactNode;
}

/**
 * A subsection title row inside a PagePanel — Global_Design_Rules §1.
 *
 * Pattern: H2 on the left, optional action button on the right, optional
 * muted subline beneath the H2. Used for "Recent films" / "Your films" /
 * "Voice & Music" blocks etc.
 *
 * Spacing is "Snug" (16px between title and subline) and "Roomy" (24px
 * margin-bottom before content), per Global_Design_Rules §4.
 */
export function SectionHeader({
  title,
  subline,
  action,
  className,
  ...rest
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-3",
        className
      )}
      {...rest}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-h2">{title}</h2>
        {subline ? (
          <p className="text-small text-muted-foreground">{subline}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
