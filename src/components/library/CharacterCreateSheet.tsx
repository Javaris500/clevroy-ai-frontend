"use client";

import * as React from "react";
import { Mic, Upload } from "lucide-react";
import { toast } from "sonner";

import { SettingsField } from "@/components/settings/SettingsField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useLibraryStore } from "@/stores/library-store";
import { library } from "@/lib/copy";
import { cn } from "@/lib/utils";

type FaceSource = "twin" | "upload";
type VoiceSource = "twin" | "record";

const NAME_MIN = 2;
const NAME_MAX = 32;
const NOTES_MAX = 200;

export interface CharacterCreateSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function CharacterCreateSheet({
  open,
  onOpenChange,
}: CharacterCreateSheetProps) {
  const addCharacter = useLibraryStore((s) => s.addCharacter);

  const [name, setName] = React.useState("");
  const [faceSource, setFaceSource] = React.useState<FaceSource>("twin");
  const [faceDataUrl, setFaceDataUrl] = React.useState<string | null>(null);
  const [voiceSource, setVoiceSource] = React.useState<VoiceSource>("twin");
  const [voiceDataUrl] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");

  const reset = () => {
    setName("");
    setFaceSource("twin");
    setFaceDataUrl(null);
    setVoiceSource("twin");
    setNotes("");
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(library.references.typeWarn);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFaceDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const trimmedName = name.trim();
  const nameValid =
    trimmedName.length >= NAME_MIN && trimmedName.length <= NAME_MAX;
  const canSave = nameValid;

  const handleSave = () => {
    if (!canSave) return;
    const id = addCharacter({
      name: trimmedName,
      faceDataUrl: faceSource === "upload" ? faceDataUrl : null,
      voiceDataUrl: voiceSource === "record" ? voiceDataUrl : null,
      styleNotes: notes.trim().slice(0, NOTES_MAX),
    });
    toast.success(library.characters.useInFilmToast(trimmedName));
    onOpenChange(false);
    reset();
    return id;
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
          <SheetTitle>{library.characters.sheetTitle}</SheetTitle>
          <SheetDescription>
            {library.characters.sheetDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          <SettingsField
            label={library.characters.nameLabel}
            helper={library.characters.nameHelper}
            error={
              name.length > 0 && !nameValid
                ? library.characters.nameTooShort
                : null
            }
            htmlFor="char-name"
            required
          >
            <Input
              id="char-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={library.characters.namePlaceholder}
              maxLength={NAME_MAX}
              autoComplete="off"
            />
          </SettingsField>

          <SettingsField label={library.characters.faceSource}>
            <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SourceTile
                selected={faceSource === "twin"}
                onClick={() => setFaceSource("twin")}
                label={library.characters.faceUseTwin}
              />
              <SourceTile
                selected={faceSource === "upload"}
                onClick={() => {
                  setFaceSource("upload");
                  fileInputRef.current?.click();
                }}
                label={library.characters.faceUpload}
                icon={<Upload className="size-3.5" aria-hidden="true" />}
              />
            </div>
            {faceSource === "upload" && faceDataUrl ? (
              <div className="mt-2 size-20 overflow-hidden rounded-full border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faceDataUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </SettingsField>

          <SettingsField label={library.characters.voiceSource}>
            <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SourceTile
                selected={voiceSource === "twin"}
                onClick={() => setVoiceSource("twin")}
                label={library.characters.voiceUseTwin}
              />
              <SourceTile
                selected={voiceSource === "record"}
                onClick={() => {
                  setVoiceSource("record");
                  // TODO(layer 5): MediaRecorder + 30s cap.
                  // eslint-disable-next-line no-console
                  console.warn("Voice recording pending Layer 5");
                  toast.info(library.characters.voiceRecordPending);
                }}
                label={library.characters.voiceRecord}
                icon={<Mic className="size-3.5" aria-hidden="true" />}
              />
            </div>
          </SettingsField>

          <SettingsField
            label={library.characters.notesLabel}
            helper={library.characters.notesHelper}
            htmlFor="char-notes"
          >
            <Textarea
              id="char-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
              placeholder={library.characters.notesPlaceholder}
              rows={4}
              className="resize-none"
            />
            <p className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">
              {library.characters.notesCounter(notes.length)}
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
            {library.characters.cancel}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!canSave}
            onClick={handleSave}
          >
            {library.characters.save}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SourceTile({
  selected,
  onClick,
  label,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
        selected
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
