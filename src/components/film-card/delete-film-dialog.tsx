"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteFilmDialog } from "@/lib/copy";

type DeleteFilmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Disable the confirm button while the delete mutation is in-flight. */
  pending?: boolean;
};

// Modal copy is verbatim from Brand_Guide §7.5 — see `deleteFilmDialog` in
// src/lib/copy.ts. Destructive action keeps the plain "Delete it" verb (§5.4).
// Focus management and Escape handling come from shadcn's Dialog primitive.

export function DeleteFilmDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
}: DeleteFilmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deleteFilmDialog.title}</DialogTitle>
          <DialogDescription>{deleteFilmDialog.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {deleteFilmDialog.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
          >
            {deleteFilmDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
