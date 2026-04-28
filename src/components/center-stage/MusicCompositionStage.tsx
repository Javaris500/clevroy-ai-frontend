"use client";

// Phase: `music_composition`. Wide animated waveform spans the full center
// stage. Behind it, all the scene images cycle at 40% opacity on a 1.5s
// rotation. Design_System §8.4.

import { useEffect, useState } from "react";

import type { Scene } from "@/types/api";
import { centerStage } from "@/lib/copy";

import { Waveform } from "./Waveform";

export type MusicCompositionStageProps = {
  scenes: Scene[];
  styleLabel: string | null;
  prefersReducedMotion: boolean;
};

const ROTATION_MS = 1500;

export function MusicCompositionStage({
  scenes,
  styleLabel,
  prefersReducedMotion,
}: MusicCompositionStageProps) {
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || scenes.length === 0) return;
    const t = setInterval(() => {
      setBgIndex((i) => (i + 1) % scenes.length);
    }, ROTATION_MS);
    return () => clearInterval(t);
  }, [prefersReducedMotion, scenes.length]);

  const bg = scenes[bgIndex];

  return (
    <div aria-hidden="true" className="relative h-full w-full overflow-hidden bg-background">
      {/* Cycling scene-image background at 40% opacity */}
      <div className="absolute inset-0 opacity-40 transition-opacity duration-300">
        {bg?.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={bg.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      {/* Wide waveform centered */}
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2">
        <Waveform
          height={140}
          color="var(--primary)"
          paused={prefersReducedMotion}
          variant="bars"
          bars={64}
        />
      </div>

      {/* Style label */}
      <div className="absolute inset-x-0 bottom-8 text-center">
        <p className="text-caption text-muted-foreground">
          {styleLabel ? `${styleLabel} score` : centerStage.musicComposingLabel}
        </p>
      </div>
    </div>
  );
}

export default MusicCompositionStage;
