"use client";

// Covers two backend states: `cie_building` and `character_refs`.
// Design_System §8.4: a grid of character cards — placeholder → portrait,
// with a 100ms stagger per card.

import { useEffect, useState } from "react";
import { UserSquare2 } from "lucide-react";

import type { Character } from "@/types/api";

export type CharacterRefsStageProps = {
  characters: Character[];
  prefersReducedMotion: boolean;
};

export function CharacterRefsStage({
  characters,
  prefersReducedMotion,
}: CharacterRefsStageProps) {
  const [stagger, setStagger] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setStagger(characters.length);
      return;
    }
    if (stagger >= characters.length) return;
    const t = setTimeout(() => setStagger((s) => s + 1), 100);
    return () => clearTimeout(t);
  }, [stagger, characters.length, prefersReducedMotion]);

  return (
    <div className="flex h-full w-full items-center justify-center px-6 py-5">
      <ul
        aria-hidden="true"
        className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {characters.map((c, i) => {
          const visible = i < stagger;
          const ready = c.state === "ref_ready" && c.reference_image_url;
          return (
            <li
              key={c.id}
              className={[
                "group flex flex-col items-center gap-2 rounded-lg border border-border bg-muted p-3",
                "transition-opacity duration-300",
                visible ? "opacity-100" : "opacity-0",
              ].join(" ")}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-secondary">
                {ready ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={c.reference_image_url ?? ""}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <UserSquare2 className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-h3">{c.name}</h3>
                {c.description ? (
                  <p className="text-small text-muted-foreground">{c.description}</p>
                ) : null}
                {!ready ? (
                  <p className="mt-1 text-caption text-muted-foreground">
                    Generating portrait…
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CharacterRefsStage;
