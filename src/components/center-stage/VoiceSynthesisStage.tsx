"use client";

// Phase: `voice_synthesis`. Scene image at 60% opacity behind, an animated
// waveform across the middle, and the dialogue line being spoken as a
// subtitle in the lower third. Design_System §8.4.

import type { Character, DialogueLine, Scene } from "@/types/api";
import { centerStage } from "@/lib/copy";

import { Waveform } from "./Waveform";

export type VoiceSynthesisStageProps = {
  scene: Scene | null;
  line: DialogueLine | null;
  character: Character | null;
  prefersReducedMotion: boolean;
};

export function VoiceSynthesisStage({
  scene,
  line,
  character,
  prefersReducedMotion,
}: VoiceSynthesisStageProps) {
  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden bg-background"
    >
      {/* Scene image at 60% opacity */}
      <div className="absolute inset-0 opacity-60">
        {scene?.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={scene.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      {/* Waveform overlay across the middle */}
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2">
        <Waveform
          height={88}
          color="var(--primary)"
          paused={prefersReducedMotion}
          variant="line"
        />
      </div>

      {/* Subtitle in the lower third */}
      <div className="absolute inset-x-0 bottom-8 px-8 text-center">
        {line ? (
          <p className="text-body-lg text-foreground">
            {character?.name ? (
              <span className="mr-2 font-mono text-caption uppercase tracking-wider text-muted-foreground">
                {character.name}
              </span>
            ) : null}
            <span className="font-serif italic">“{line.text}”</span>
          </p>
        ) : (
          <p className="text-body text-muted-foreground">
            {centerStage.voiceLineSubtitleFallback}
          </p>
        )}
      </div>
    </div>
  );
}

export default VoiceSynthesisStage;
