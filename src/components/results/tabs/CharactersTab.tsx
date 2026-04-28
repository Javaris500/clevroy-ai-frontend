"use client";

// Zone 3 — Characters tab. Grid of Pass-1 reference portraits per Design_System
// §7.5. Each card: avatar (or initial fallback) + name + short description.
// Mobile = 2-up, tablet = 3-up, desktop = 4-up to mirror Projects' grid rhythm.

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { resultsTabs } from "@/lib/copy";
import type { Character } from "@/types/api";

export interface CharactersTabProps {
  characters: Character[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CharactersTab({ characters }: CharactersTabProps) {
  if (characters.length === 0) {
    return (
      <p className="text-body text-muted-foreground">
        {resultsTabs.charactersEmpty}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {characters.map((character) => (
        <Card key={character.id} className="overflow-hidden p-0">
          <div className="aspect-square bg-muted">
            <Avatar className="h-full w-full rounded-none">
              {character.reference_image_url ? (
                <AvatarImage
                  src={character.reference_image_url}
                  alt={`${character.name} reference portrait`}
                  className="h-full w-full rounded-none object-cover"
                />
              ) : null}
              <AvatarFallback className="h-full w-full rounded-none text-h2 font-serif text-muted-foreground">
                {initials(character.name) || "—"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-1 p-3">
            <p className="text-h3">{character.name}</p>
            {character.description ? (
              <p className="line-clamp-3 text-small text-muted-foreground">
                {character.description}
              </p>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default CharactersTab;
