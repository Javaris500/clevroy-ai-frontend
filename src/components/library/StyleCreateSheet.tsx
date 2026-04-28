"use client";

import * as React from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { SettingsField } from "@/components/settings/SettingsField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLibraryStore } from "@/stores/library-store";
import { library } from "@/lib/copy";
import { STYLE_PRESETS, type StylePreset } from "@/stores/create-options-store";
import { cn } from "@/lib/utils";

const NAME_MAX = 48;
const FRAGMENTS_MAX = 12;

export interface StyleCreateSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function StyleCreateSheet({ open, onOpenChange }: StyleCreateSheetProps) {
  const addStyle = useLibraryStore((s) => s.addStyle);

  const [name, setName] = React.useState("");
  const [basedOn, setBasedOn] = React.useState<StylePreset | "custom">("custom");
  const [fragments, setFragments] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState("");

  const reset = () => {
    setName("");
    setBasedOn("custom");
    setFragments([]);
    setDraft("");
  };

  const addFragment = () => {
    const t = draft.trim();
    if (!t) return;
    if (fragments.length >= FRAGMENTS_MAX) {
      toast.warning("That's the fragment limit.");
      return;
    }
    setFragments((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setDraft("");
  };

  const removeFragment = (frag: string) => {
    setFragments((prev) => prev.filter((f) => f !== frag));
  };

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

  const samplePrompt = fragments.join(", ");

  const handleSave = () => {
    if (!canSave) return;
    addStyle({
      name: trimmedName.slice(0, NAME_MAX),
      basedOn: basedOn === "custom" ? null : basedOn,
      fragments,
      thumbnailUrl: `https://picsum.photos/seed/clev-style-${encodeURIComponent(
        trimmedName,
      )}/320/200`,
    });
    toast.success(library.styles.useAsDefaultToast(trimmedName));
    onOpenChange(false);
    reset();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px]"
      >
        <SheetHeader>
          <SheetTitle>{library.styles.sheetTitle}</SheetTitle>
          <SheetDescription>{library.styles.sheetDescription}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          <SettingsField
            label={library.styles.nameLabel}
            htmlFor="style-name"
            required
          >
            <Input
              id="style-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={library.styles.namePlaceholder}
              maxLength={NAME_MAX}
              autoComplete="off"
            />
          </SettingsField>

          <SettingsField label={library.styles.basedOnLabel} htmlFor="style-base">
            <Select
              value={basedOn}
              onValueChange={(v) => setBasedOn(v as StylePreset | "custom")}
            >
              <SelectTrigger id="style-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">
                  {library.styles.basedOnCustom}
                </SelectItem>
                {STYLE_PRESETS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField
            label={library.styles.fragmentsLabel}
            helper={library.styles.fragmentsHelper}
            htmlFor="style-fragments"
          >
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              {fragments.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFragment(f)}
                    aria-label={`Remove ${f}`}
                    className="rounded-full p-0.5 hover:bg-primary/15"
                  >
                    <X className="size-2.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                id="style-fragments"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFragment();
                  } else if (e.key === "Backspace" && !draft && fragments.length) {
                    setFragments((prev) => prev.slice(0, -1));
                  }
                }}
                placeholder={
                  fragments.length === 0
                    ? library.styles.fragmentsPlaceholder
                    : ""
                }
                className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </SettingsField>

          <SettingsField label={library.styles.samplePromptLabel}>
            <p
              className={cn(
                "min-h-[3rem] rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed",
                samplePrompt ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {samplePrompt || library.styles.samplePromptEmpty}
            </p>
          </SettingsField>
        </div>

        <SheetFooter className="mt-auto gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {library.styles.cancel}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!canSave}
            onClick={handleSave}
          >
            {library.styles.save}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
