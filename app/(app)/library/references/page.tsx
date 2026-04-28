"use client";

// /library/references — drag-drop image upload + thumbnail grid.

import * as React from "react";
import { ImageIcon, MoreHorizontal, Trash, Upload } from "lucide-react";
import { toast } from "sonner";

import { LibraryEmptyState } from "@/components/library/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  LIBRARY_CAPS,
  useLibraryStore,
  type Reference,
} from "@/stores/library-store";
import { library } from "@/lib/copy";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function deriveTitle(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base || "Reference";
}

function useReferenceUploader() {
  const addReference = useLibraryStore((s) => s.addReference);

  return React.useCallback(
    async (files: FileList | File[]) => {
      let added = 0;
      let overflowed = false;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(library.references.typeWarn);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(library.references.sizeWarn);
          continue;
        }
        const dataUrl = await readAsDataUrl(file);
        const wasOverflow = addReference({
          title: deriveTitle(file.name),
          imageDataUrl: dataUrl,
        });
        if (wasOverflow) overflowed = true;
        added += 1;
      }
      if (added > 0) toast.success(library.references.addedToast(added));
      if (overflowed) toast.warning(library.references.capWarn);
    },
    [addReference],
  );
}

// ---------------------------------------------------------------------------
// Drop zone — wraps either the empty state or the upload tile.
// ---------------------------------------------------------------------------

function useDropZone(onFiles: (files: FileList) => void) {
  const [over, setOver] = React.useState(false);
  const handlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(false);
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    },
  };
  return { over, handlers };
}

// ---------------------------------------------------------------------------
// Tile
// ---------------------------------------------------------------------------

function ReferenceTile({ reference }: { reference: Reference }) {
  const renameReference = useLibraryStore((s) => s.renameReference);
  const deleteReference = useLibraryStore((s) => s.deleteReference);

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(reference.title);
  const [viewOpen, setViewOpen] = React.useState(false);

  const handleUseInFilm = () => {
    try {
      window.sessionStorage.setItem("clevroy:home:reference", reference.id);
    } catch {
      /* non-fatal */
    }
    toast.success(`${reference.title} ready for your next film.`);
    window.location.assign("/home");
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setViewOpen(true)}
        className="block aspect-square w-full overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reference.imageDataUrl}
          alt={reference.title}
          className="size-full object-cover transition-transform duration-200 hover:scale-[1.02]"
        />
      </button>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        {renameOpen ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const t = renameValue.trim();
                if (t) renameReference(reference.id, t);
                setRenameOpen(false);
              } else if (e.key === "Escape") {
                setRenameOpen(false);
              }
            }}
            onBlur={() => {
              const t = renameValue.trim();
              if (t && t !== reference.title)
                renameReference(reference.id, t);
              setRenameOpen(false);
            }}
            autoFocus
            className="text-sm"
          />
        ) : (
          <p className="truncate text-sm font-medium text-foreground">
            {reference.title}
          </p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${reference.title} actions`}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setViewOpen(true)}>
              {library.references.view}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleUseInFilm}>
              {library.references.use}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setRenameOpen(true);
                setRenameValue(reference.title);
              }}
            >
              {library.references.rename}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                deleteReference(reference.id);
                toast.success(`${reference.title} deleted.`);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="size-3.5" aria-hidden="true" />
              {library.references.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {reference.title}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reference.imageDataUrl}
              alt={reference.title}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setViewOpen(false)}
            >
              Close
            </Button>
            <Button className="rounded-full" onClick={handleUseInFilm}>
              {library.references.use}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function UploadTile({
  onFiles,
  count,
}: {
  onFiles: (files: FileList) => void;
  count: number;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { over, handlers } = useDropZone(onFiles);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      aria-label={library.references.addNew}
      {...handlers}
      className={cn(
        "flex min-h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-muted-foreground",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        over
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-muted/20 hover:border-primary/40 hover:bg-accent hover:text-foreground",
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-background">
        <Upload className="size-4" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-sm font-medium">{library.references.addNew}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
        {count} / {LIBRARY_CAPS.references}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}

export default function LibraryReferencesPage() {
  const references = useLibraryStore((s) => s.references);
  const onFiles = useReferenceUploader();
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (references.length === 0) {
    return (
      <LibraryEmptyState
        headline={library.references.empty}
        description={library.references.dropZoneIdle}
        cta={{
          label: library.references.addNew,
          onClick: () => inputRef.current?.click(),
        }}
      >
        <DropZoneFallback onFiles={onFiles} />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </LibraryEmptyState>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {references.map((r) => (
        <ReferenceTile key={r.id} reference={r} />
      ))}
      <UploadTile onFiles={onFiles} count={references.length} />
    </div>
  );
}

function DropZoneFallback({
  onFiles,
}: {
  onFiles: (files: FileList) => void;
}) {
  const { over, handlers } = useDropZone(onFiles);
  return (
    <div
      {...handlers}
      className={cn(
        "mt-4 flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-xs transition-colors",
        over
          ? "border-primary bg-primary-soft text-primary"
          : "text-muted-foreground",
      )}
    >
      <ImageIcon className="size-3.5" aria-hidden="true" />
      <span>{library.references.dropZoneIdle}</span>
    </div>
  );
}

