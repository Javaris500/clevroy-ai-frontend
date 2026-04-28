import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/**
 * Loading skeleton for the (chat) route group (/home, /create, /films/[id]).
 * Chat surfaces are headerless and centered (CLAUDE.md "Header decision
 * 2026-04-28: Option A"), so the parent (app)/loading.tsx — a 4-col card
 * grid — would feel wrong on first entry. This shape mirrors the empty
 * ChatSurface: a centered filmstrip Spinner + welcome line + prompt-input
 * pill near bottom. The Spinner is sized larger here than the in-page
 * status rows because the chat surface has no other chrome — the loader is
 * doing the visual work alone.
 *
 * Once the (chat) layout is mounted in a session, navigations within the
 * group don't unmount the layout, so this rarely fires after the first
 * paint. Mostly relevant when the user lands on /home from outside the
 * (app) tree, or hard-reloads a chat URL.
 */
export default function ChatLoading() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Spinner className="size-9 text-primary" label={null} />
      <div className="flex w-full max-w-xl flex-col items-center gap-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-56" />
      </div>
      <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
    </div>
  );
}
