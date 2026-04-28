"use client";

import * as React from "react";

import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * ResponsiveToaster — Layout_Enhancements B.27.
 *
 * Sonner's <Toaster> takes a single `position` prop, but the right
 * placement differs by viewport: on mobile the bottom-tab-bar owns the
 * thumb zone, so toasts go to `top-center`; on tablet/desktop they sit
 * at `bottom-right` out of the way of primary content. This wrapper
 * picks the placement off `useIsMobile()` and forwards the rest of the
 * Toaster API through. SSR returns `bottom-right` (the desktop default),
 * matching the rendered HTML; the first effect flips to `top-center` on
 * phones before any toast fires.
 */
export function ResponsiveToaster() {
  const isMobile = useIsMobile();
  return (
    <Toaster
      position={isMobile ? "top-center" : "bottom-right"}
      offset={isMobile ? "16px" : "24px"}
    />
  );
}
