"use client";

// /library/styles — saved style presets with editable prompt fragments.

import * as React from "react";
import { Copy, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { LibraryEmptyState } from "@/components/library/EmptyState";
import { StyleCreateSheet } from "@/components/library/StyleCreateSheet";
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
import { useLibraryStore, type SavedStyle } from "@/stores/library-store";
import { library } from "@/lib/copy";
import { cn } from "@/lib/utils";

function StyleTile({ style }: { style: SavedStyle }) {
  const renameStyle = useLibraryStore((s) => s.renameStyle);
  const deleteStyle = useLibraryStore((s) => s.deleteStyle);
  const duplicateStyle = useLibraryStore((s) => s.duplicateStyle);

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(style.name);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleUseAsDefault = () => {
    // Persist the saved-style name as the default style preset proxy. Layer 5
    // will route this through a richer create-options-store extension that
    // accepts saved-style ids beyond the four built-in presets.
    try {
      window.sessionStorage.setItem("clevroy:home:style", style.name);
    } catch {
      /* non-fatal */
    }
    toast.success(library.styles.useAsDefaultToast(style.name));
  };

  return (
    <article className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={style.thumbnailUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex items-start justify-between gap-2 px-4 pt-1">
        {renameOpen ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const t = renameValue.trim();
                if (t) renameStyle(style.id, t);
                setRenameOpen(false);
              } else if (e.key === "Escape") {
                setRenameOpen(false);
              }
            }}
            onBlur={() => {
              const t = renameValue.trim();
              if (t && t !== style.name) renameStyle(style.id, t);
              setRenameOpen(false);
            }}
            autoFocus
            className="text-base"
          />
        ) : (
          <p className="font-serif text-lg font-semibold text-foreground">
            {style.name}
          </p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${style.name} actions`}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleUseAsDefault}>
              {library.styles.useAsDefault}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setRenameOpen(true);
                setRenameValue(style.name);
              }}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              {library.styles.rename}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                duplicateStyle(style.id);
                toast.success(`Duplicated ${style.name}.`);
              }}
            >
              <Copy className="size-3.5" aria-hidden="true" />
              {library.styles.duplicate}
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
              {library.styles.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {style.basedOn ? (
        <p className="px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {library.styles.basedOnCaption(style.basedOn)}
        </p>
      ) : null}
      {style.fragments.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-4">
          {style.fragments.map((f) => (
            <span
              key={f}
              className="rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary"
            >
              {f}
            </span>
          ))}
        </div>
      ) : null}
      <div className="px-4 pb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-full"
          onClick={handleUseAsDefault}
        >
          {library.styles.useAsDefault}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={library.styles.deleteConfirm.title(style.name)}
        body={library.styles.deleteConfirm.body}
        verbs="delete"
        onConfirm={() => {
          deleteStyle(style.id);
          toast.success(`${style.name} deleted.`);
        }}
      />
    </article>
  );
}

function NewStyleTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={library.styles.addNewAria}
      className={cn(
        "flex min-h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-muted-foreground",
        "transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-background">
        <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-sm font-medium">{library.styles.addNew}</span>
    </button>
  );
}

export default function LibraryStylesPage() {
  const styles = useLibraryStore((s) => s.savedStyles);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  if (styles.length === 0) {
    return (
      <div className="space-y-4">
        <LibraryEmptyState
          headline="Build a style. Reuse it across films."
          description={library.styles.empty}
          cta={{
            label: library.styles.addNew,
            onClick: () => setSheetOpen(true),
          }}
        />
        <StyleCreateSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {styles.map((s) => (
          <StyleTile key={s.id} style={s} />
        ))}
        <NewStyleTile onClick={() => setSheetOpen(true)} />
      </div>
      <StyleCreateSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
