"use client";

// Zone 3 — Voice & Music tab. Lists each character's assigned ElevenLabs
// voice plus the soundtrack info. Audio playback uses a vanilla <audio>
// element with `controls` — same accessibility shape as the hero player.

import type { Character, DialogueLine } from "@/types/api";
import { resultsTabs, voiceMusicLabels } from "@/lib/copy";

export interface VoiceMusicTabProps {
  characters: Character[];
  /** First synthesized line per character, used as a sample preview. */
  dialogue_lines: DialogueLine[];
  /** Backend doesn't expose a music_url on Film yet — when it does, render an
   *  <audio> player. Until then the score panel stays metadata-only. */
  stylePreset: string;
  musicUrl?: string | null;
}

export function VoiceMusicTab({
  characters,
  dialogue_lines,
  stylePreset,
  musicUrl,
}: VoiceMusicTabProps) {
  const sampleByCharacter = new Map<string, DialogueLine>();
  for (const line of dialogue_lines) {
    if (line.audio_url && !sampleByCharacter.has(line.character_id)) {
      sampleByCharacter.set(line.character_id, line);
    }
  }

  if (characters.length === 0 && !musicUrl) {
    return (
      <p className="text-body text-muted-foreground">
        {resultsTabs.voiceMusicEmpty}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="vm-voices" className="space-y-3">
        <h3 id="vm-voices" className="text-h3">
          {voiceMusicLabels.voicesHeader}
        </h3>
        {characters.length === 0 ? (
          <p className="text-small text-muted-foreground">
            {resultsTabs.voiceMusicEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {characters.map((character) => {
              const sample = sampleByCharacter.get(character.id);
              return (
                <li
                  key={character.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-body-md">{character.name}</p>
                    <p className="text-small font-mono text-muted-foreground">
                      {character.voice_id ?? "—"}
                    </p>
                  </div>
                  {sample?.audio_url ? (
                    <audio
                      src={sample.audio_url}
                      controls
                      preload="none"
                      className="h-9"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="vm-score" className="space-y-3">
        <h3 id="vm-score" className="text-h3">
          {voiceMusicLabels.scoreHeader}
        </h3>
        <div className="rounded-lg border border-border px-4 py-3">
          <p className="text-body-md">
            {voiceMusicLabels.scoreStyle(stylePreset)}
          </p>
          {musicUrl ? (
            <audio
              src={musicUrl}
              controls
              preload="none"
              className="mt-2 h-9 w-full"
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default VoiceMusicTab;
