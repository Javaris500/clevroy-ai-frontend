"use client";

// /library/characters — implicit "You" tile + saved character grid + "+ New".

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Plus, UserSquare } from "lucide-react";
import { toast } from "sonner";

import { CharacterCreateSheet } from "@/components/library/CharacterCreateSheet";
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
import { useProfile } from "@/hooks/use-profile";
import {
  useLibraryStore,
  type Character,
} from "@/stores/library-store";
import { library } from "@/lib/copy";
import { cn } from "@/lib/utils";

const SESSION_KEY = "clevroy:home:character";

function twinStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function PrimaryTile() {
  const { profile } = useProfile();
  const voice = twinStatusLabel(profile?.voice_twin_status ?? "none");
  const face = twinStatusLabel(profile?.face_twin_status ?? "none");
  const portrait = profile?.face_twin_key
    ? `https://picsum.photos/seed/${encodeURIComponent(profile.face_twin_key)}/240/240`
    : null;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/40 bg-primary-soft"
          aria-hidden="true"
        >
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} alt="" className="size-full object-cover" />
          ) : (
            <UserSquare className="size-8 text-primary" strokeWidth={1.5} />
          )}
        </div>
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          Primary
        </span>
      </div>
      <p className="font-serif text-xl font-semibold text-foreground">
        {library.characters.primaryName}
      </p>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {library.characters.primaryHelper(voice, face)}
      </p>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-auto rounded-full"
      >
        <Link href="/ai-twin">{library.characters.primaryEdit}</Link>
      </Button>
    </article>
  );
}

function CharacterTile({ character }: { character: Character }) {
  const { profile } = useProfile();
  const renameCharacter = useLibraryStore((s) => s.renameCharacter);
  const deleteCharacter = useLibraryStore((s) => s.deleteCharacter);

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(character.name);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const portrait =
    character.faceDataUrl ??
    (profile?.face_twin_key
      ? `https://picsum.photos/seed/${encodeURIComponent(profile.face_twin_key)}-${character.id}/240/240`
      : null);

  const handleUseInFilm = () => {
    try {
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          id: character.id,
          name: character.name,
          styleNotes: character.styleNotes,
        }),
      );
    } catch {
      /* storage unavailable — non-fatal */
    }
    toast.success(library.characters.useInFilmToast(character.name));
    window.location.assign("/home");
  };

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div
          className="size-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted"
          aria-hidden="true"
        >
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <UserSquare className="size-8" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${character.name} actions`}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleUseInFilm}>
              {library.characters.useInFilm}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setRenameOpen((v) => !v);
                setRenameValue(character.name);
              }}
            >
              {library.characters.rename}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              {library.characters.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {renameOpen ? (
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const t = renameValue.trim();
              if (t) renameCharacter(character.id, t);
              setRenameOpen(false);
            } else if (e.key === "Escape") {
              setRenameOpen(false);
            }
          }}
          onBlur={() => {
            const t = renameValue.trim();
            if (t && t !== character.name) renameCharacter(character.id, t);
            setRenameOpen(false);
          }}
          autoFocus
          className="text-sm"
        />
      ) : (
        <p className="font-serif text-lg font-semibold text-foreground">
          {character.name}
        </p>
      )}
      {character.styleNotes ? (
        <p className="line-clamp-2 font-mono text-[11px] leading-relaxed tracking-wider text-muted-foreground">
          {character.styleNotes}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-auto rounded-full"
        onClick={handleUseInFilm}
      >
        {library.characters.useInFilm}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={library.characters.deleteConfirm.title(character.name)}
        body={library.characters.deleteConfirm.body}
        verbs="delete"
        onConfirm={() => {
          deleteCharacter(character.id);
          toast.success(`${character.name} deleted.`);
        }}
      />
    </article>
  );
}

function NewCharacterTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={library.characters.addNewAria}
      className={cn(
        "flex min-h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-muted-foreground",
        "transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-background">
        <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-sm font-medium">{library.characters.addNew}</span>
    </button>
  );
}

export default function LibraryCharactersPage() {
  const characters = useLibraryStore((s) => s.characters);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PrimaryTile />
        {characters.map((c) => (
          <CharacterTile key={c.id} character={c} />
        ))}
        <NewCharacterTile onClick={() => setSheetOpen(true)} />
      </div>
      <CharacterCreateSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
