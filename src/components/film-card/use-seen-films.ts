"use client";

// Tiny localStorage-backed store of completed-film IDs the user has clicked
// on at least once. Drives the "New" badge on Home / Projects until the user
// opens that film. Kept local to the FilmCard surface so we don't grow another
// cross-agent contract; if Stratum later tracks `viewed_at` on the backend,
// this hook becomes a one-liner that delegates to that field and we drop the
// localStorage key.
//
// Storage key is namespaced so it doesn't collide with Zustand's UI store.

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "clevroy:seen-films:v1";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Quota exceeded or storage disabled — non-fatal, badge just stays.
  }
}

export function useSeenFilms() {
  // Avoid SSR hydration mismatch: render an empty set on the server, then
  // hydrate from localStorage once mounted.
  const [seen, setSeen] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSeen(readSet());
  }, []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      writeSet(next);
      return next;
    });
  }, []);

  const isSeen = useCallback((id: string) => seen.has(id), [seen]);

  return { isSeen, markSeen };
}
