"use client";

import * as React from "react";

/**
 * Returns true once the component has mounted on the client. Use this to gate
 * any consumer of a `zustand/middleware` `persist` store whose first paint
 * would otherwise show the empty initial state and then snap to the
 * rehydrated state on the next tick.
 *
 * Costs one extra client-side render per consumer. Cheap enough to default
 * to over `skipHydration: true`, which would force every store consumer to
 * call `useChatStore.persist.rehydrate()` manually.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
