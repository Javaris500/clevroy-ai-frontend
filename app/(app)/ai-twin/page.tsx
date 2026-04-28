"use client";

// AI Twin page — Design_System §7.6.
//
// Two cards side-by-side (stacked on mobile):
//   1. Voice twin — record samples, playback, delete.
//   2. Face twin — drag-drop 5–10 photos with explicit click fallback (CC-3),
//      training progress, reference portrait preview, delete.
//
// EC-N10 — training failure UX:
//   - Plain-language reason in a warning banner above the affected card.
//   - "Try again with these {photos|samples}" preserves the upload (24h hold).
//   - "Start over" clears the upload and resets the card.
//   - On the third failure, a "Why this might be failing" link unlocks a help
//     modal with the photo / audio requirements bullets.
//
// State is local-only for MVP. When Stratum's S6 ships:
//   - `useTwins()` for status (none / training / ready / failed)
//   - `useVoiceTwinUploadUrl` / `useFaceTwinUploadUrl` for direct-to-R2 signed
//     upload requests (Stratum confirmed upload-url shape in 2026-04-24 note)
//   - `useStartVoiceTwin` / `useStartFaceTwin` to kick off training

import { useRef, useState } from "react";

import { PagePanel } from "@/components/shell/PagePanel";
import { SectionHeader } from "@/components/shell/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aiTwin, confirmVerbPairs } from "@/lib/copy";
import { cn } from "@/lib/utils";
import type { TwinStatus } from "@/types/api";

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 10;

interface UploadedPhoto {
  id: string;
  name: string;
  /** Object URL for preview thumbnails. Revoke on unmount / replace. */
  url: string;
}

function StatusBadge({ status }: { status: TwinStatus }) {
  const tone =
    status === "ready"
      ? "default"
      : status === "training"
        ? "secondary"
        : status === "failed"
          ? "destructive"
          : "outline";
  return <Badge variant={tone}>{aiTwin.status[status]}</Badge>;
}

// --------------------------------------------------------------------------- //
// Voice twin card                                                             //
// --------------------------------------------------------------------------- //

function VoiceTwinCard() {
  const [status, setStatus] = useState<TwinStatus>("none");
  const [failureCount, setFailureCount] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleRecord = () => {
    // TODO(stratum-S6): open recorder; on submit -> useStartVoiceTwin
    setStatus("training");
  };

  const handleDelete = () => {
    // TODO(stratum-S6): DELETE /api/me/twins/voice
    setStatus("none");
    setFailureCount(0);
    setDeleteOpen(false);
  };

  // Demo helpers for showing failure / ready states without backend.
  const _devSimulateReady = () => setStatus("ready");
  const _devSimulateFailure = () => {
    setStatus("failed");
    setFailureCount((c) => c + 1);
  };

  void _devSimulateReady;
  void _devSimulateFailure;

  const body =
    status === "ready"
      ? aiTwin.voiceCard.readyBody
      : status === "training"
        ? aiTwin.voiceCard.trainingBody
        : aiTwin.voiceCard.untrainedBody;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{aiTwin.voiceCard.title}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription>{body}</CardDescription>
      </CardHeader>

      {status === "failed" ? (
        <CardContent>
          <FailureBanner
            reason={aiTwin.failure.voiceReason}
            preserved
            onRetry={handleRecord}
            onStartOver={() => setStatus("none")}
            retryLabel={aiTwin.failure.retryWithExistingVoice}
            failureCount={failureCount}
            onOpenHelp={() => setHelpOpen(true)}
          />
        </CardContent>
      ) : null}

      <CardFooter className="flex flex-wrap gap-2">
        {status === "ready" ? (
          <>
            <Button variant="outline">{aiTwin.voiceCard.playSample}</Button>
            <Button variant="outline" onClick={handleRecord}>
              {aiTwin.voiceCard.rerecordCta}
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              {aiTwin.voiceCard.deleteCta}
            </Button>
          </>
        ) : status === "training" ? null : (
          <Button onClick={handleRecord}>{aiTwin.voiceCard.recordCta}</Button>
        )}
      </CardFooter>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        verbs="delete"
        title={aiTwin.voiceCard.deleteDialog.title}
        body={aiTwin.voiceCard.deleteDialog.body}
        onConfirm={handleDelete}
      />

      <FailureHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        kind="voice"
      />
    </Card>
  );
}

// --------------------------------------------------------------------------- //
// Face twin card                                                              //
// --------------------------------------------------------------------------- //

function FaceTwinCard() {
  const [status, setStatus] = useState<TwinStatus>("none");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => {
      const merged: UploadedPhoto[] = [
        ...prev,
        ...arr.map((f) => ({
          id: `${f.name}-${f.lastModified}-${f.size}`,
          name: f.name,
          url: URL.createObjectURL(f),
        })),
      ];
      // Cap at MAX_PHOTOS to avoid unbounded uploads.
      if (merged.length > MAX_PHOTOS) {
        return merged.slice(0, MAX_PHOTOS);
      }
      return merged;
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleTrain = () => {
    if (photos.length < MIN_PHOTOS) return;
    // TODO(stratum-S6): for each photo, POST /api/me/twins/face/upload-url,
    // PUT to R2, collect keys, then POST /api/me/twins/face/train { sample_keys }
    setStatus("training");
  };

  const handleDelete = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setStatus("none");
    setFailureCount(0);
    setDeleteOpen(false);
  };

  // Drag handlers — preventDefault is required for drop to fire.
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) acceptFiles(e.dataTransfer.files);
  };

  const onChooseFiles = () => fileInputRef.current?.click();

  const showDropZone = status === "none" || status === "failed";
  const canTrain = photos.length >= MIN_PHOTOS && status !== "training";

  const body =
    status === "ready"
      ? aiTwin.faceCard.readyBody
      : status === "training"
        ? aiTwin.faceCard.trainingBody
        : aiTwin.faceCard.untrainedBody;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{aiTwin.faceCard.title}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription>{body}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === "failed" ? (
          <FailureBanner
            reason={aiTwin.failure.faceReason}
            preserved
            onRetry={handleTrain}
            onStartOver={() => {
              photos.forEach((p) => URL.revokeObjectURL(p.url));
              setPhotos([]);
              setStatus("none");
            }}
            retryLabel={aiTwin.failure.retryWithExisting}
            failureCount={failureCount}
            onOpenHelp={() => setHelpOpen(true)}
          />
        ) : null}

        {showDropZone ? (
          <>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                isDragOver
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-muted/30",
              )}
            >
              <p className="text-body text-muted-foreground">
                {aiTwin.faceCard.dropZoneLabel}
              </p>
              <Button type="button" onClick={onChooseFiles} variant="outline">
                {aiTwin.faceCard.chooseFiles}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) acceptFiles(e.target.files);
                  // Reset so picking the same files twice fires onChange.
                  e.target.value = "";
                }}
              />
            </div>
            <p className="text-small text-muted-foreground">
              {aiTwin.faceCard.chooseFilesFallback}
            </p>
          </>
        ) : null}

        {photos.length > 0 ? (
          <>
            <p
              className="text-small text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {aiTwin.faceCard.photoCounter(
                photos.length,
                MIN_PHOTOS,
                MAX_PHOTOS,
              )}
            </p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((photo) => (
                <li key={photo.id} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="size-full rounded-md object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${photo.name}`}
                    onClick={() => removePhoto(photo.id)}
                    className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-background/80 text-mono text-small hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <details className="text-small">
          <summary className="cursor-pointer font-medium">
            {aiTwin.faceCard.constraints.title}
          </summary>
          <ul className="mt-2 space-y-1 pl-5 text-muted-foreground [list-style:disc]">
            {aiTwin.faceCard.constraints.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </details>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {status === "ready" ? (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            {aiTwin.faceCard.deleteCta}
          </Button>
        ) : status === "training" ? null : (
          <Button onClick={handleTrain} disabled={!canTrain}>
            {aiTwin.faceCard.train}
          </Button>
        )}
      </CardFooter>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        verbs="delete"
        title={aiTwin.faceCard.deleteDialog.title}
        body={aiTwin.faceCard.deleteDialog.body}
        onConfirm={handleDelete}
      />

      <FailureHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        kind="face"
      />
    </Card>
  );
}

// --------------------------------------------------------------------------- //
// Failure banner — EC-N10                                                     //
// --------------------------------------------------------------------------- //

interface FailureBannerProps {
  reason: string;
  preserved: boolean;
  onRetry: () => void;
  onStartOver: () => void;
  retryLabel: string;
  failureCount: number;
  onOpenHelp: () => void;
}

function FailureBanner({
  reason,
  preserved,
  onRetry,
  onStartOver,
  retryLabel,
  failureCount,
  onOpenHelp,
}: FailureBannerProps) {
  // Help link unlocks on the third failure, per EC-N10.
  const showHelpLink = failureCount >= 3;

  return (
    <div
      role="alert"
      className="space-y-3 rounded-md border-l-4 border-warning bg-primary-soft p-4"
    >
      <p className="text-body">{reason}</p>
      {preserved ? (
        <p className="text-small text-muted-foreground">
          {aiTwin.failure.preservedBanner}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
        <Button size="sm" variant="outline" onClick={onStartOver}>
          {aiTwin.failure.startOver}
        </Button>
        {showHelpLink ? (
          <button
            type="button"
            onClick={onOpenHelp}
            className="text-small text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Why this might be failing
          </button>
        ) : null}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Failure help dialog — unlocked after the 3rd failure                        //
// --------------------------------------------------------------------------- //

function FailureHelpDialog({
  open,
  onOpenChange,
  kind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "voice" | "face";
}) {
  const meta = aiTwin.failure.helpModal[kind];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.body}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 pl-5 text-body [list-style:disc]">
          {meta.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {confirmVerbPairs.confirm.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------- //
// Page                                                                        //
// --------------------------------------------------------------------------- //

export default function AiTwinPage() {
  return (
    <div className="px-6 py-6 md:px-8 md:py-8">
      <PagePanel title={aiTwin.pageTitle} subline={aiTwin.subline}>
        <div className="grid gap-6 md:grid-cols-2">
          <VoiceTwinCard />
          <FaceTwinCard />
        </div>

        <SectionHeader
          title={aiTwin.twinUseExplainer.title}
          className="mt-10"
        />
        <p className="text-body text-muted-foreground">
          {aiTwin.twinUseExplainer.body}
        </p>
      </PagePanel>
    </div>
  );
}
