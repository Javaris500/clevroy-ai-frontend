"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Single TanStack Query client mounted at the app root. Stratum's hooks
 * (`useUser`, `useRecentFilms`, `useInfiniteFilms`, mutations…) read from
 * this client. Defaults are conservative for Clevroy's mostly-Realtime
 * data flow:
 *   - staleTime 30s — paired with Supabase Realtime invalidation, so the
 *     UI feels live without thrashing the API on every focus.
 *   - retry false on mutations — TanStack defaults are too aggressive for
 *     credit-affecting actions; Stratum can opt-in per-mutation.
 *   - refetchOnWindowFocus on for queries — pairs with EC-G1 (mobile resume)
 *     and EC-N5 (session-expired catch-up). Stratum can override per-hook.
 */
function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserClient: QueryClient | undefined;
function getClient() {
  if (typeof window === "undefined") return makeClient();
  browserClient ??= makeClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
