import * as React from "react";

import { cn } from "@/lib/utils";

export type FilmCardGridLayout = "grid" | "scroller";

export interface FilmCardGridProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "aria-label"> {
  /**
   * `grid` — responsive 1/2/3/4-column layout (Projects, search results).
   * `scroller` — horizontal-scroll row with edge-bleed (Home recent films).
   * Layout_Enhancements B.22.
   */
  layout: FilmCardGridLayout;
  /** ARIA label on the underlying `<ul>`. Required for the grid; in scroller
   *  contexts the label usually lives on the surrounding section heading. */
  "aria-label"?: string;
  /** When the grid is rendering skeletons, mark the whole list as hidden. */
  "aria-hidden"?: boolean;
  /** Optional class on the `<ul>`. Falls through after the layout classes. */
  className?: string;
  /** Wrapper class — only used in `scroller` mode. Lets the page tweak the
   *  bleed area (e.g. swap the @md container-query for a viewport break) on
   *  the rare surface where the panel padding deviates from PagePanel's. */
  scrollerWrapperClassName?: string;
  children: React.ReactNode;
}

/**
 * Shared layout primitive for film-card lists. Replaces the two duplicated
 * patterns called out in the layout audit:
 *   - app/(app)/home/page.tsx     → scroller (horizontal recent-films row)
 *   - app/(app)/projects/page.tsx → grid     (1/2/3/4-col responsive grid)
 *
 * Item rendering is the consumer's responsibility — pass `<li>` children with
 * whatever width / shrink modifiers fit the layout. In `scroller` mode each
 * item should be `shrink-0` with a fixed width; in `grid` mode items fill
 * their cell.
 *
 * Grid breakpoints follow Layout_Enhancements B.22 verbatim:
 *   `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6`
 *
 * Scroller bleed uses container-query breakpoints (`@md:`) so the negative
 * margin tracks `PagePanel`'s container-aware padding (`p-6 @md:p-8`) rather
 * than viewport width — important when an open sidebar squeezes the panel
 * below `md` while the viewport is still ≥768px.
 */
export const FilmCardGrid = React.forwardRef<HTMLUListElement, FilmCardGridProps>(
  function FilmCardGrid(
    {
      layout,
      className,
      scrollerWrapperClassName,
      children,
      ...rest
    },
    ref,
  ) {
    if (layout === "scroller") {
      return (
        <div
          className={cn(
            "-mx-6 overflow-x-auto px-6 @md:-mx-8 @md:px-8",
            scrollerWrapperClassName,
          )}
        >
          <ul
            ref={ref}
            className={cn("flex gap-4", className)}
            {...rest}
          >
            {children}
          </ul>
        </div>
      );
    }

    return (
      <ul
        ref={ref}
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6",
          className,
        )}
        {...rest}
      >
        {children}
      </ul>
    );
  },
);
