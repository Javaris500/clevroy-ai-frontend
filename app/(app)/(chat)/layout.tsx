"use client";

// Shared chat-surface layout for /home, /create, /films/[id]. Per
// docs/Clevroy_Chat_Surface.md §13, these three routes are the same
// surface in three states (empty / mint-redirect / thread). The single
// <ChatSurface> instance is owned here, not at the page level — that
// way navigating between routes does not remount the chat. Pages under
// this group exist only so the routes resolve; their bodies are stubs.

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { Atmosphere } from "@/components/chat/atmosphere/Atmosphere";
import { ChatSurface, type ChatSubmit } from "@/components/chat/ChatSurface";
import { useProfile } from "@/hooks/use-profile";
import { mintFilm } from "@/lib/chat/mint-film";
import { useAddUser, useMarkSettled, type AttachmentRef } from "@/stores/chat-store";

function useFirstName(): string | null {
  // Reads from the single <ProfileProvider /> mounted in app/(app)/layout.tsx.
  const { profile } = useProfile();
  return profile?.first_name?.trim() || null;
}

function modeForPath(pathname: string | null): "empty" | "thread" {
  if (!pathname) return "empty";
  if (pathname.startsWith("/films/")) return "thread";
  return "empty";
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const firstName = useFirstName();

  const mode = modeForPath(pathname);
  const filmId = mode === "thread" ? (params?.id ?? undefined) : undefined;

  const addUser = useAddUser();
  const markSettled = useMarkSettled();

  const [pending, setPending] = React.useState(false);

  const onSubmit = React.useCallback(
    async ({ text, files }: ChatSubmit) => {
      if (pending) return;
      // Files arrive as `FileUIPart` from the AI Elements input — strip them
      // down to the small `AttachmentRef` the chat store understands. Note
      // that the `url` is a browser blob URL; Layer 5 will replace it with
      // an R2-signed URL after upload.
      const attachments: AttachmentRef[] = files.map((f) => ({
        filename: f.filename ?? "file",
        mediaType: f.mediaType ?? "application/octet-stream",
        url: f.url ?? "",
      }));
      setPending(true);
      try {
        if (mode === "empty") {
          // Mint-first: we need a film_id before we can key the optimistic
          // bubble into a thread. The 250ms fixture latency is the trade-
          // off; Layer 5 replaces it with a real API call.
          const { film_id } = await mintFilm();
          const id = addUser(film_id, text, attachments);
          markSettled(film_id, id);
          router.replace(`/films/${film_id}`);
        } else if (filmId) {
          // Thread mode — Layer 4 will fire useChat / API. For Layer 2/3
          // we just push the bubble and settle it.
          const id = addUser(filmId, text, attachments);
          await new Promise((r) => setTimeout(r, 250));
          markSettled(filmId, id);
        }
      } catch {
        // Layer 5 owns real error UX (system-style fallback message).
      } finally {
        setPending(false);
      }
    },
    [mode, filmId, pending, addUser, markSettled, router],
  );

  // Children render but are visually empty stubs — the surface is here.
  // Keeping them in the tree preserves the route boundary for future
  // server-side hydration (Layer 5 on /films/[id]).
  return (
    <>
      <Atmosphere />
      <div className="hidden">{children}</div>
      <ChatSurface
        mode={mode}
        firstName={firstName}
        filmId={filmId}
        onSubmit={onSubmit}
        disabled={pending}
        key={filmId ?? "empty"}
      />
    </>
  );
}
