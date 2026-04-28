"use client";

// Zone 1 — "Take it home" dropdown. Three formats:
//   - Video (MP4) → sync signed URL → trigger browser download immediately.
//   - Book (PDF) / Website (ZIP) → async export task → poll status →
//     toast when ready with a download link.
//
// Brand_Guide §5.4 ("Take it home", surface unit "films"). EC-G10 / Brand voice
// for success and failure toasts. Global_Design_Rules §1 (use shadcn primitives,
// not one-off menus) §3 (motion at duration-base 200ms via shadcn defaults).

import { useState } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  Globe,
  Video,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { takeItHome, type TakeItHomeFormatLabel } from "@/lib/copy";
import type { ApiError, ExportFormat } from "@/types/api";

import {
  useExportTaskStatus,
  useRequestMp4Export,
  useStartPdfExport,
  useStartZipExport,
} from "./use-exports";

export interface TakeItHomeMenuProps {
  filmId: string;
  /** Disabled when the film isn't `complete` (e.g., still error/in-progress). */
  disabled?: boolean;
}

type ActiveExport = {
  format: ExportFormat;
  taskId: string;
};

const FORMAT_LABEL: Record<ExportFormat, TakeItHomeFormatLabel> = {
  mp4: "video",
  "book-pdf": "book",
  "website-zip": "website",
};

const FORMAT_ICON: Record<ExportFormat, LucideIcon> = {
  mp4: Video,
  "book-pdf": BookOpen,
  "website-zip": Globe,
};

/**
 * Triggers a browser download for a signed URL without leaving the page.
 * The URL is single-use per the backend's signing policy (1 hour TTL).
 */
function triggerDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  // The Content-Disposition on R2 should be `attachment`; this attribute is a
  // hint for browsers that don't honor it inline.
  anchor.download = "";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function TakeItHomeMenu({ filmId, disabled = false }: TakeItHomeMenuProps) {
  const [activeExport, setActiveExport] = useState<ActiveExport | null>(null);

  const mp4 = useRequestMp4Export(filmId);
  const pdf = useStartPdfExport(filmId);
  const zip = useStartZipExport(filmId);
  const status = useExportTaskStatus(activeExport?.taskId ?? null);

  // When the polled status flips to "ready" or "failed", surface a toast and
  // clear the active task. Pure read-then-act; never call mutations from
  // render. We rely on the query hook's polling lifecycle for the wakeup —
  // running a one-shot effect off the latest snapshot keeps this readable.
  if (
    activeExport &&
    status.data &&
    (status.data.status === "ready" || status.data.status === "failed")
  ) {
    const formatLabel = FORMAT_LABEL[activeExport.format];
    const url = status.data.url;
    const finishedFormat = activeExport.format;
    // Defer to a microtask so we never set state during render.
    queueMicrotask(() => {
      if (status.data?.status === "ready" && url) {
        const ready = takeItHome.ready(formatLabel);
        toast.success(ready.title, {
          description: ready.body,
          action: { label: ready.action, onClick: () => triggerDownload(url) },
        });
        triggerDownload(url);
      } else {
        const failed = takeItHome.failed(formatLabel);
        toast.warning(failed.title, { description: failed.body });
      }
      // Clear only if we're still tracking the same task — avoids a race where
      // the user kicked off another export between render and microtask.
      setActiveExport((prev) =>
        prev && prev.format === finishedFormat ? null : prev,
      );
    });
  }

  const isPreparingFormat = (format: ExportFormat): boolean =>
    activeExport?.format === format;

  const onPickMp4 = () => {
    if (mp4.isPending) return;
    mp4.mutate(undefined, {
      onSuccess: (data) => {
        triggerDownload(data.url);
        const ready = takeItHome.ready("video");
        toast.success(ready.title, {
          description: ready.body,
          action: {
            label: ready.action,
            onClick: () => triggerDownload(data.url),
          },
        });
      },
      onError: (err: ApiError) => {
        const failed = takeItHome.failed("video");
        toast.warning(failed.title, {
          description: err.message || failed.body,
        });
      },
    });
  };

  const onPickAsync = (
    format: Exclude<ExportFormat, "mp4">,
    start: typeof pdf | typeof zip,
  ) => {
    if (start.isPending || activeExport) return;
    start.mutate(undefined, {
      onSuccess: (data) => {
        setActiveExport({ format, taskId: data.task_id });
      },
      onError: (err: ApiError) => {
        const failed = takeItHome.failed(FORMAT_LABEL[format]);
        toast.warning(failed.title, {
          description: err.message || failed.body,
        });
      },
    });
  };

  const itemDisabled = disabled || mp4.isPending || pdf.isPending || zip.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          disabled={disabled}
          aria-label={takeItHome.trigger}
        >
          <ArrowDownToLine className="size-4" strokeWidth={1.5} aria-hidden />
          {takeItHome.trigger}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>{takeItHome.trigger}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ExportMenuItem
          format="mp4"
          disabled={itemDisabled}
          preparing={isPreparingFormat("mp4")}
          onSelect={onPickMp4}
        />
        <ExportMenuItem
          format="book-pdf"
          disabled={itemDisabled}
          preparing={isPreparingFormat("book-pdf")}
          onSelect={() => onPickAsync("book-pdf", pdf)}
        />
        <ExportMenuItem
          format="website-zip"
          disabled={itemDisabled}
          preparing={isPreparingFormat("website-zip")}
          onSelect={() => onPickAsync("website-zip", zip)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ExportMenuItemProps {
  format: ExportFormat;
  disabled: boolean;
  preparing: boolean;
  onSelect: () => void;
}

function ExportMenuItem({
  format,
  disabled,
  preparing,
  onSelect,
}: ExportMenuItemProps) {
  const Icon = FORMAT_ICON[format];
  const item =
    format === "mp4"
      ? takeItHome.items.mp4
      : format === "book-pdf"
        ? takeItHome.items.pdf
        : takeItHome.items.zip;
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        if (!disabled && !preparing) onSelect();
      }}
      disabled={disabled || preparing}
      className="flex items-start gap-3 py-2"
    >
      <Icon className="mt-0.5 size-4" strokeWidth={1.5} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-body-md">{item.label}</div>
        <div className="text-small text-muted-foreground">
          {preparing ? takeItHome.preparing(FORMAT_LABEL[format]) : item.subline}
        </div>
      </div>
    </DropdownMenuItem>
  );
}

export default TakeItHomeMenu;
