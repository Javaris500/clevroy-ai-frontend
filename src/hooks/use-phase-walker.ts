"use client";

import * as React from "react";

import { useAddMessage, type ThreadMessage } from "@/stores/chat-store";
import {
  buildPhaseScript,
  type PhaseEvent,
  type PhaseScript,
} from "@/lib/chat/phase-walker";

/**
 * Drives the fixture phase script for a single film. On mount (or when
 * `enabled` flips to true), schedules every event in the script via
 * setTimeout against `atMs` and pushes it into the chat store via
 * `addMessage(filmId, ...)`.
 *
 * Layer 3 owns wiring this into ChatSurface — this file just exposes the
 * primitive. Layer 5 replaces the timer chain with a Realtime subscription
 * that calls the same `addMessage` shape; Layer 3 components don't need to
 * know which side fed them.
 *
 * Returns:
 *   - status — "idle" | "running" | "complete"
 *   - advance() — fast-forward the rest of the script to "complete" state.
 *     Lets dev tooling (and future debug overlays) skip ahead without
 *     waiting on the timeline.
 */
export type PhaseWalkerStatus = "idle" | "running" | "complete";

export type UsePhaseWalker = {
  status: PhaseWalkerStatus;
  advance: () => void;
};

function eventToMessage(
  event: PhaseEvent,
): Omit<ThreadMessage, "id" | "filmId" | "createdAt"> {
  switch (event.type) {
    case "narration":
      return { type: "narration", content: event.content };
    case "asset":
      return {
        type: "asset",
        content: "",
        metadata: event.metadata,
      };
    case "activity":
      return { type: "activity", content: event.content };
    case "system":
      return { type: "system", content: event.content };
  }
}

export function usePhaseWalker(
  filmId: string | null | undefined,
  scriptText: string,
  options: { enabled?: boolean } = {},
): UsePhaseWalker {
  const { enabled = true } = options;
  const addMessage = useAddMessage();

  const [status, setStatus] = React.useState<PhaseWalkerStatus>("idle");

  // Pin the phase script to (filmId, scriptText) so it doesn't rebuild on
  // every render. The script itself is deterministic.
  const script: PhaseScript = React.useMemo(
    () => (filmId ? buildPhaseScript(scriptText) : []),
    [filmId, scriptText],
  );

  const timersRef = React.useRef<number[]>([]);
  const remainingRef = React.useRef<PhaseScript>([]);
  const filmIdRef = React.useRef<string | null | undefined>(filmId);

  React.useEffect(() => {
    filmIdRef.current = filmId;
  }, [filmId]);

  // Schedule the script when enabled flips on for a film.
  React.useEffect(() => {
    if (!enabled || !filmId || script.length === 0) {
      return;
    }

    setStatus("running");
    remainingRef.current = script;

    const start = Date.now();
    const localTimers: number[] = [];

    script.forEach((entry, idx) => {
      const id = window.setTimeout(() => {
        const currentFilm = filmIdRef.current;
        if (!currentFilm) return;
        addMessage(currentFilm, eventToMessage(entry.event));
        // Keep `remainingRef` in sync so `advance()` can pick up the slack.
        remainingRef.current = script.slice(idx + 1);
        if (idx === script.length - 1) {
          setStatus("complete");
        }
      }, entry.atMs);
      localTimers.push(id);
    });

    timersRef.current = localTimers;
    void start; // reserved for future "skipPast" logic if a thread is rehydrated mid-run

    return () => {
      for (const id of localTimers) window.clearTimeout(id);
      timersRef.current = [];
    };
  }, [enabled, filmId, script, addMessage]);

  const advance = React.useCallback(() => {
    const film = filmIdRef.current;
    if (!film) return;
    // Drain pending timers and fire the rest synchronously in order.
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
    const pending = remainingRef.current;
    if (!pending || pending.length === 0) {
      setStatus("complete");
      return;
    }
    for (const entry of pending) {
      addMessage(film, eventToMessage(entry.event));
    }
    remainingRef.current = [];
    setStatus("complete");
  }, [addMessage]);

  return { status, advance };
}
