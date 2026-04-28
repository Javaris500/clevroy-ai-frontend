"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Per-film thread store. Replaces the prior flat `optimisticMessages` array
 * with a `threads` map keyed by `filmId` so multiple films don't collide on
 * the same surface. Persisted to localStorage so a hard refresh doesn't
 * empty the thread.
 *
 * Spec: docs/Clevroy_Chat_Surface.md §2 (the five message types) and §6
 * (persistence). Layer 5 will replace the local `addMessage` calls with a
 * Realtime subscription that also writes into this store, so the store
 * shape is the contract Layer 4/5 land on top of.
 *
 * Hydration model: this store uses `zustand/middleware`'s `persist` with the
 * default async rehydration. Components that need to render the persisted
 * value on first paint must gate on `useHydrated()` (see
 * `src/hooks/use-hydrated.ts`) — otherwise SSR returns the empty initial
 * state and the client paints the rehydrated state, producing a visible
 * shift. We picked `useHydrated()` over `skipHydration: true` because the
 * one extra render is cheap and avoids manual `rehydrate()` plumbing in
 * every consumer.
 */

// ---------------------------------------------------------------------------
// Types — exported for callers (Layer 3 consumes these to render messages).
// ---------------------------------------------------------------------------

export type MessageType = "user" | "narration" | "asset" | "activity" | "system";

export type AssetKind =
  | "scene_image"
  | "scene_playback"
  | "character_refs"
  | "final_film"
  | "assembly_preview";

export type CharacterRef = {
  id: string;
  name: string;
  portraitUrl: string;
};

export type AttachmentRef = {
  filename: string;
  mediaType: string;
  /** Browser blob URL. Note: blob URLs do NOT survive a page reload —
   *  on rehydrate the URL will be stale. Layer 5 will swap these for
   *  R2-signed URLs when uploads ship; until then, attachments on a
   *  rehydrated thread render with name + size only. */
  url: string;
};

export type ThreadMessageMetadata = {
  assetKind?: AssetKind;
  sceneId?: string;
  sceneNumber?: number;
  imageUrl?: string;
  playbackUrl?: string;
  posterUrl?: string;
  characters?: ReadonlyArray<CharacterRef>;
  /** User-attached files on `user`-type messages. */
  attachments?: ReadonlyArray<AttachmentRef>;
  [key: string]: unknown;
};

export type ThreadMessage = {
  id: string;
  filmId: string;
  type: MessageType;
  content: string;
  metadata?: ThreadMessageMetadata;
  /** Epoch ms — used for sort + relative-time rendering. */
  createdAt: number;
  /** True while optimistic, false once settled by the network/walker. */
  pending?: boolean;
};

// Stored thread cap. Zustand's persist middleware will keep only the most-
// recently-touched 20 threads in localStorage so the bundle never bloats
// past a few KB even after months of use.
export const MAX_PERSISTED_THREADS = 20;

// Stable empty-array reference. Selectors that fall back to this value will
// not trigger re-renders for components subscribed via reference equality.
// Frozen so accidental mutation is loud rather than silent.
export const EMPTY_THREAD: ReadonlyArray<ThreadMessage> = Object.freeze([]);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type ThreadsMap = Record<string, ReadonlyArray<ThreadMessage>>;

export type ChatStore = {
  threads: ThreadsMap;

  /** Append a message to a film's thread. Returns the generated id. */
  addMessage: (
    filmId: string,
    msg: Omit<ThreadMessage, "id" | "filmId" | "createdAt">,
  ) => string;
  /** Optimistic-user shortcut. Same as `addMessage(filmId, { type: "user", content: text, pending: true })`,
   *  with an optional attachments list folded into `metadata.attachments`. */
  addUser: (
    filmId: string,
    text: string,
    attachments?: ReadonlyArray<AttachmentRef>,
  ) => string;
  /** Mark a previously-pending message as settled. No-op if id not found. */
  markSettled: (filmId: string, id: string) => void;
  /** Drop all messages for a single film (used when a film is canceled
   *  and the thread should not survive into a new one). */
  clearFilm: (filmId: string) => void;
};

function trimToCap(threads: ThreadsMap, cap: number): ThreadsMap {
  const ids = Object.keys(threads);
  if (ids.length <= cap) return threads;
  // Sort by max(createdAt) within each thread, descending. Threads with no
  // messages sort last and are the first to be dropped.
  const ranked = ids
    .map((id) => {
      const list = threads[id]!;
      let max = 0;
      for (let i = 0; i < list.length; i += 1) {
        const t = list[i]!.createdAt;
        if (t > max) max = t;
      }
      return { id, max };
    })
    .sort((a, b) => b.max - a.max);
  const next: ThreadsMap = {};
  for (let i = 0; i < cap; i += 1) {
    const { id } = ranked[i]!;
    next[id] = threads[id]!;
  }
  return next;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      threads: {},

      addMessage: (filmId, msg) => {
        const id = crypto.randomUUID();
        const message: ThreadMessage = {
          ...msg,
          id,
          filmId,
          createdAt: Date.now(),
        };
        set((state) => {
          const current = state.threads[filmId] ?? EMPTY_THREAD;
          const nextThread: ReadonlyArray<ThreadMessage> = [...current, message];
          const nextThreads: ThreadsMap = {
            ...state.threads,
            [filmId]: nextThread,
          };
          return { threads: trimToCap(nextThreads, MAX_PERSISTED_THREADS) };
        });
        return id;
      },

      addUser: (filmId, text, attachments) => {
        const id = crypto.randomUUID();
        const message: ThreadMessage = {
          id,
          filmId,
          type: "user",
          content: text,
          pending: true,
          createdAt: Date.now(),
          metadata:
            attachments && attachments.length > 0
              ? { attachments }
              : undefined,
        };
        set((state) => {
          const current = state.threads[filmId] ?? EMPTY_THREAD;
          const nextThread: ReadonlyArray<ThreadMessage> = [...current, message];
          const nextThreads: ThreadsMap = {
            ...state.threads,
            [filmId]: nextThread,
          };
          return { threads: trimToCap(nextThreads, MAX_PERSISTED_THREADS) };
        });
        return id;
      },

      markSettled: (filmId, id) =>
        set((state) => {
          const current = state.threads[filmId];
          if (!current) return state;
          let changed = false;
          const next = current.map((m) => {
            if (m.id !== id) return m;
            if (m.pending === false) return m;
            changed = true;
            return { ...m, pending: false };
          });
          if (!changed) return state;
          return {
            threads: { ...state.threads, [filmId]: next },
          };
        }),

      clearFilm: (filmId) =>
        set((state) => {
          if (!(filmId in state.threads)) return state;
          const next = { ...state.threads };
          delete next[filmId];
          return { threads: next };
        }),
    }),
    {
      name: "clevroy:chat:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Persist only the threads map (the action functions are recreated on
      // every page load and don't belong in storage).
      partialize: (state) => ({ threads: state.threads }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Selector hooks. Always pass narrow selectors so consumers don't re-render
// on unrelated changes (e.g. typing in the textarea must not reflow message
// bubbles). The `EMPTY_THREAD` fallback is a stable reference so selectors
// returning it on miss don't trigger re-renders either.
// ---------------------------------------------------------------------------

export function useMessages(filmId: string | null | undefined): ReadonlyArray<ThreadMessage> {
  return useChatStore((s) => (filmId ? (s.threads[filmId] ?? EMPTY_THREAD) : EMPTY_THREAD));
}

export function useAddMessage() {
  return useChatStore((s) => s.addMessage);
}

export function useAddUser() {
  return useChatStore((s) => s.addUser);
}

export function useMarkSettled() {
  return useChatStore((s) => s.markSettled);
}

export function useClearFilm() {
  return useChatStore((s) => s.clearFilm);
}
