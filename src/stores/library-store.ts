"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Aspect, StylePreset } from "@/stores/create-options-store";

/**
 * The user's private vault — saved templates, recurring characters, custom
 * styles, reference images, and unsent drafts. Persisted to localStorage
 * under a single key so a refresh doesn't empty the workbench.
 *
 * Layer 5 will swap the persist middleware for backend-backed CRUD; the
 * call surface stays identical so consumers don't change.
 */

// ---------------------------------------------------------------------------
// Storage caps
// ---------------------------------------------------------------------------

export const LIBRARY_CAPS = {
  templates: 50,
  references: 20,
  drafts: 30,
  characters: 50,
  styles: 50,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Character {
  id: string;
  name: string;
  /** Data URL for an uploaded face. `null` falls back to the primary AI Twin face. */
  faceDataUrl: string | null;
  /** Data URL for a recorded voice clip. `null` falls back to the primary AI Twin voice. */
  voiceDataUrl: string | null;
  /** Up to 200 chars of prompt fragment ("Maya wears a blue trench coat, mid-30s, soft-spoken"). */
  styleNotes: string;
  /** True for the implicit "You" tile — never persisted, but a future migration
   *  could promote a selected character to primary. */
  isPrimary: boolean;
  createdAt: string;
}

export interface SavedStyle {
  id: string;
  name: string;
  basedOn: StylePreset | null;
  fragments: string[];
  thumbnailUrl: string;
  createdAt: string;
}

export interface Reference {
  id: string;
  title: string;
  imageDataUrl: string;
  createdAt: string;
}

export interface Draft {
  id: string;
  title: string;
  script: string;
  style: StylePreset | null;
  aspect: Aspect;
  lastEditedAt: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type LibraryStore = {
  // --- Saved templates ---
  savedTemplateIds: string[];
  saveTemplate: (id: string) => boolean;
  unsaveTemplate: (id: string) => void;
  isTemplateSaved: (id: string) => boolean;

  // --- Characters ---
  characters: Character[];
  addCharacter: (
    c: Omit<Character, "id" | "createdAt" | "isPrimary">,
  ) => string;
  renameCharacter: (id: string, name: string) => void;
  deleteCharacter: (id: string) => void;

  // --- Styles ---
  savedStyles: SavedStyle[];
  addStyle: (s: Omit<SavedStyle, "id" | "createdAt">) => string;
  renameStyle: (id: string, name: string) => void;
  deleteStyle: (id: string) => void;
  duplicateStyle: (id: string) => string | null;

  // --- References ---
  references: Reference[];
  addReference: (r: Omit<Reference, "id" | "createdAt">) => boolean;
  renameReference: (id: string, title: string) => void;
  deleteReference: (id: string) => void;

  // --- Drafts ---
  drafts: Draft[];
  addDraft: (d: Omit<Draft, "id" | "lastEditedAt">) => string;
  updateDraft: (
    id: string,
    patch: Partial<Omit<Draft, "id" | "lastEditedAt">>,
  ) => void;
  renameDraft: (id: string, title: string) => void;
  deleteDraft: (id: string) => void;
};

function uid(): string {
  return crypto.randomUUID();
}

function trimToCap<T extends { createdAt?: string; lastEditedAt?: string }>(
  list: ReadonlyArray<T>,
  cap: number,
): T[] {
  if (list.length <= cap) return [...list];
  // Keep the most recent `cap` entries — sort by lastEditedAt || createdAt desc.
  const ts = (item: T) => item.lastEditedAt ?? item.createdAt ?? "";
  const sorted = [...list].sort((a, b) => ts(b).localeCompare(ts(a)));
  return sorted.slice(0, cap);
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      // --- Saved templates ---
      savedTemplateIds: [],
      saveTemplate: (id) => {
        const current = get().savedTemplateIds;
        if (current.includes(id)) return false;
        if (current.length >= LIBRARY_CAPS.templates) {
          // Drop the oldest (= first-saved); FIFO.
          set({ savedTemplateIds: [...current.slice(1), id] });
          return true;
        }
        set({ savedTemplateIds: [...current, id] });
        return true;
      },
      unsaveTemplate: (id) =>
        set((s) => ({
          savedTemplateIds: s.savedTemplateIds.filter((x) => x !== id),
        })),
      isTemplateSaved: (id) => get().savedTemplateIds.includes(id),

      // --- Characters ---
      characters: [],
      addCharacter: (c) => {
        const id = uid();
        const character: Character = {
          ...c,
          id,
          isPrimary: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          characters: trimToCap(
            [...s.characters, character],
            LIBRARY_CAPS.characters,
          ),
        }));
        return id;
      },
      renameCharacter: (id, name) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === id ? { ...c, name } : c,
          ),
        })),
      deleteCharacter: (id) =>
        set((s) => ({
          characters: s.characters.filter((c) => c.id !== id),
        })),

      // --- Styles ---
      savedStyles: [],
      addStyle: (style) => {
        const id = uid();
        const next: SavedStyle = {
          ...style,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          savedStyles: trimToCap(
            [...s.savedStyles, next],
            LIBRARY_CAPS.styles,
          ),
        }));
        return id;
      },
      renameStyle: (id, name) =>
        set((s) => ({
          savedStyles: s.savedStyles.map((x) =>
            x.id === id ? { ...x, name } : x,
          ),
        })),
      deleteStyle: (id) =>
        set((s) => ({
          savedStyles: s.savedStyles.filter((x) => x.id !== id),
        })),
      duplicateStyle: (id) => {
        const orig = get().savedStyles.find((s) => s.id === id);
        if (!orig) return null;
        const newId = uid();
        const copy: SavedStyle = {
          ...orig,
          id: newId,
          name: `${orig.name} copy`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          savedStyles: trimToCap(
            [...s.savedStyles, copy],
            LIBRARY_CAPS.styles,
          ),
        }));
        return newId;
      },

      // --- References ---
      references: [],
      addReference: (r) => {
        const id = uid();
        const next: Reference = {
          ...r,
          id,
          createdAt: new Date().toISOString(),
        };
        const current = get().references;
        const overflow = current.length >= LIBRARY_CAPS.references;
        const list = overflow ? current.slice(1) : current;
        set({ references: [...list, next] });
        return overflow;
      },
      renameReference: (id, title) =>
        set((s) => ({
          references: s.references.map((r) =>
            r.id === id ? { ...r, title } : r,
          ),
        })),
      deleteReference: (id) =>
        set((s) => ({ references: s.references.filter((r) => r.id !== id) })),

      // --- Drafts ---
      drafts: [],
      addDraft: (d) => {
        const id = uid();
        const next: Draft = {
          ...d,
          id,
          lastEditedAt: new Date().toISOString(),
        };
        set((s) => ({
          drafts: trimToCap([...s.drafts, next], LIBRARY_CAPS.drafts),
        }));
        return id;
      },
      updateDraft: (id, patch) =>
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id
              ? { ...d, ...patch, lastEditedAt: new Date().toISOString() }
              : d,
          ),
        })),
      renameDraft: (id, title) =>
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id
              ? { ...d, title, lastEditedAt: new Date().toISOString() }
              : d,
          ),
        })),
      deleteDraft: (id) =>
        set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),
    }),
    {
      name: "clevroy:library:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** Auto-derive a title from the first ~8 words of a script. */
export function deriveDraftTitle(script: string): string {
  const trimmed = script.trim();
  if (!trimmed) return "Untitled draft";
  const words = trimmed.split(/\s+/).slice(0, 8).join(" ");
  return words.length > 64 ? `${words.slice(0, 61)}…` : words;
}
