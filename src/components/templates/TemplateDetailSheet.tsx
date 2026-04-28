"use client";

// <TemplateDetailSheet /> — right-side Sheet that opens on TemplateCard
// click. Hero plays the sample clip autoplay-muted with an unmute toggle
// (44px) mirrored on the ScenePlaybackCard primitive. Below the hero,
// title + meta + description + script preview + "What's included." Sticky
// footer with primary "Use this template" + secondary "Save to Library"
// + tertiary Close.
//
// "Use this template" pipes the script + style + aspect into sessionStorage
// keys the EmptyView on /home reads on mount, then routes to /home. Same
// handoff onboarding step 5 uses; templates extend it with style + aspect.

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLibraryStore } from "@/stores/library-store";
import { templates as copy } from "@/lib/copy";
import { templateById, type Template } from "@/lib/templates/data";
import { cn } from "@/lib/utils";

const PREFILL_KEY = "clevroy:home:prefill";
const PREFILL_STYLE_KEY = "clevroy:home:prefill-style";
const PREFILL_ASPECT_KEY = "clevroy:home:prefill-aspect";

export interface TemplateDetailSheetProps {
  /** When non-null, the sheet is open and shows the template with this id. */
  templateId: string | null;
  onOpenChange: (open: boolean) => void;
}

function durationCaption(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0
    ? `${minutes} minute${minutes === 1 ? "" : "s"}`
    : `${minutes}m ${rest}s`;
}

function categoryLabel(category: Template["category"]): string {
  return copy.filter[category];
}

function aspectLabel(aspect: Template["aspect"]): string {
  return aspect;
}

function styleLabel(style: Template["style"]): string {
  return style;
}

function PreviewHero({ template }: { template: Template }) {
  const reduceMotion = useReducedMotion();
  const [muted, setMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
      <div className="aspect-video w-full">
        <video
          ref={videoRef}
          src={template.preview_url}
          poster={template.poster_url}
          autoPlay={!reduceMotion}
          muted={muted}
          loop
          playsInline
          controls={false}
          className="size-full object-cover"
        />
      </div>
      <button
        type="button"
        aria-label={muted ? copy.detail.unmuteAria : copy.detail.muteAria}
        aria-pressed={!muted}
        onClick={toggleMute}
        className={cn(
          "absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full",
          "bg-background/85 text-foreground transition-colors",
          "hover:bg-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        )}
      >
        {muted ? (
          <VolumeX className="size-4" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Volume2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function ScriptPreview({ script }: { script: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const lineCount = React.useMemo(() => script.split("\n").length, [script]);
  const isLong = lineCount > 14 || script.length > 800;

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {copy.detail.sectionScript}
      </p>
      <pre
        className={cn(
          "whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground",
          !expanded && isLong ? "max-h-56 overflow-hidden" : "max-h-[40vh] overflow-y-auto",
        )}
      >
        {script}
      </pre>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {expanded ? copy.detail.collapseScript : copy.detail.showFullScript}
        </button>
      ) : null}
    </div>
  );
}

export function TemplateDetailSheet({
  templateId,
  onOpenChange,
}: TemplateDetailSheetProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const isSaved = useLibraryStore((s) =>
    templateId ? s.isTemplateSaved(templateId) : false,
  );
  const saveTemplate = useLibraryStore((s) => s.saveTemplate);
  const unsaveTemplate = useLibraryStore((s) => s.unsaveTemplate);

  const template = templateId ? templateById(templateId) : undefined;

  function handleUse() {
    if (!template) return;
    try {
      window.sessionStorage.setItem(PREFILL_KEY, template.script);
      window.sessionStorage.setItem(PREFILL_STYLE_KEY, template.style);
      window.sessionStorage.setItem(PREFILL_ASPECT_KEY, template.aspect);
    } catch {
      // sessionStorage may be unavailable (private mode); /home will just
      // render empty in that case. Failing silently is the right move.
    }
    onOpenChange(false);
    router.push("/home");
  }

  function handleToggleSave() {
    if (!template) return;
    if (isSaved) {
      unsaveTemplate(template.id);
      toast(copy.unsavedToast);
    } else {
      saveTemplate(template.id);
      toast(copy.savedToast);
    }
  }

  return (
    <Sheet open={template != null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        {template ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <SheetHeader className="sr-only">
                <SheetTitle>{template.title}</SheetTitle>
                <SheetDescription>{template.description}</SheetDescription>
              </SheetHeader>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-5"
              >
                <PreviewHero template={template} />

                <div className="space-y-1.5">
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    {template.title}
                  </h2>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {categoryLabel(template.category)} ·{" "}
                    {durationCaption(template.duration_seconds)} ·{" "}
                    {styleLabel(template.style)} · {aspectLabel(template.aspect)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.detail.sectionDescription}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {template.description}
                  </p>
                </div>

                <ScriptPreview script={template.script} />

                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.detail.sectionIncluded}
                  </p>
                  <ul className="space-y-1 text-sm text-foreground/90">
                    <li>
                      <span className="font-mono text-xs text-muted-foreground">
                        Style ·{" "}
                      </span>
                      {styleLabel(template.style)}
                    </li>
                    <li>
                      <span className="font-mono text-xs text-muted-foreground">
                        Aspect ·{" "}
                      </span>
                      {aspectLabel(template.aspect)}
                    </li>
                    <li>
                      <span className="font-mono text-xs text-muted-foreground">
                        Length ·{" "}
                      </span>
                      ~{durationCaption(template.duration_seconds)}
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleSave}
                aria-pressed={isSaved}
                className={cn(isSaved && "border-primary/40 text-primary")}
              >
                <Heart
                  className={cn("mr-1.5 size-4", isSaved && "fill-current")}
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
                {isSaved ? copy.detail.saveAgainCta : copy.detail.saveCta}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  {copy.detail.close}
                </Button>
                <Button type="button" onClick={handleUse}>
                  {copy.detail.useCta}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
