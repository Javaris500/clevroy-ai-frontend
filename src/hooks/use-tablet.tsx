import * as React from "react"

const TABLET_MIN = 768
const TABLET_MAX = 1023

/**
 * Tablet breakpoint hook (Layout_Enhancements B.16).
 *
 * True when the viewport sits in the 768–1023px band — iPad-portrait,
 * iPad-mini-landscape, small laptops at half-screen. The (app) layout
 * uses this to default shadcn's <Sidebar collapsible="icon"> to the
 * 56px rail variant on tablet so a 9.7" iPad doesn't burn ~256px on
 * an expanded sidebar.
 *
 * Mirrors the SSR-safe pattern of `useIsMobile`: returns `false` until
 * the first effect runs, so server output and first client render agree.
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${TABLET_MIN}px) and (max-width: ${TABLET_MAX}px)`,
    )
    const onChange = () => {
      setIsTablet(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setIsTablet(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}
