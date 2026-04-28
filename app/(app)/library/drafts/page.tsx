"use client";

// /library/drafts — text-first list view of unsent scripts.

import * as React from "react";
import { MoreHorizontal, Pencil, Play, Trash } from "lucide-react";
import { toast } from "sonner";

import { LibraryEmptyState } from "@/components/library/EmptyState";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useLibraryStore, type Draft } from "@/stores/library-store";
import { formatRelative } from "@/lib/format-relative";
import { library } from "@/lib/copy";

const PREFILL_KEYS = {
  script: "clevroy:home:prefillScript",
  style: "clevroy:home:prefillStyle",
  aspect: "clevroy:home:prefillAspect",
} as const;

function DraftRow({ draft }: { draft: Draft }) {
  const renameDraft = useLibraryStore((s) => s.renameDraft);
  const deleteDraft = useLibraryStore((s) => s.deleteDraft);

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(draft.title);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleOpen = () => {
    try {
      window.sessionStorage.setItem(PREFILL_KEYS.script, draft.script);
      if (draft.style)
        window.sessionStorage.setItem(PREFILL_KEYS.style, draft.style);
      window.sessionStorage.setItem(PREFILL_KEYS.aspect, draft.aspect);
    } catch {
      /* non-fatal */
    }
    toast.success(library.drafts.openToast);
    window.location.assign("/home");
  };

  const lastEditedAt = Date.parse(draft.lastEditedAt);
  const rel = Number.isNaN(lastEditedAt) ? "" : formatRelative(lastEditedAt);

  const preview = draft.script
    .split("\n")
    .slice(0, 2)
    .join(" ")
    .trim();

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className="min-w-0 flex-1 space-y-1">
        {renameOpen ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const t = renameValue.trim();
                if (t) renameDraft(draft.id, t);
                setRenameOpen(false);
              } else if (e.key === "Escape") {
                setRenameOpen(false);
              }
            }}
            onBlur={() => {
              const t = renameValue.trim();
              if (t && t !== draft.title) renameDraft(draft.id, t);
              setRenameOpen(false);
            }}
            autoFocus
            className="text-base font-medium"
          />
        ) : (
          <p className="truncate text-base font-medium text-foreground">
            {draft.title || library.drafts.untitledFallback}
          </p>
        )}
        {preview ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{preview}</p>
        ) : null}
        {rel ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {library.drafts.lastEdited(rel)}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={handleOpen}
        >
          <Play className="size-3.5" aria-hidden="true" />
          {library.drafts.open}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${draft.title} actions`}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setRenameOpen(true);
                setRenameValue(draft.title);
              }}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              {library.drafts.rename}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="size-3.5" aria-hidden="true" />
              {library.drafts.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={library.drafts.deleteConfirm.title}
        body={library.drafts.deleteConfirm.body}
        verbs="delete"
        onConfirm={() => {
          deleteDraft(draft.id);
          toast.success("Draft deleted.");
        }}
      />
    </li>
  );
}

export default function LibraryDraftsPage() {
  const drafts = useLibraryStore((s) => s.drafts);

  if (drafts.length === 0) {
    return (
      <LibraryEmptyState
        headline="Drafts saved from Home land here."
        description={library.drafts.empty}
        cta={{ label: library.drafts.homeLink, href: "/home" }}
      />
    );
  }

  // Sort newest first.
  const sorted = [...drafts].sort((a, b) =>
    b.lastEditedAt.localeCompare(a.lastEditedAt),
  );

  return (
    <ul className="space-y-3">
      {sorted.map((d) => (
        <DraftRow key={d.id} draft={d} />
      ))}
    </ul>
  );
}
