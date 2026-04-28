"use client";

// Phase: `final_concat`. Horizontal strip of scene thumbnails advancing
// left-to-right with a moving playhead. Design_System §8.4.

import { useEffect, useState } from "react";

import type { Scene } from "@/types/api";

export type FinalConcatStageProps = {
  scenes: Scene[];
  prefersReducedMotion: boolean;
};

export function FinalConcatStage({ scenes, prefersReducedMotion }: FinalConcatStageProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setProgress(1);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const duration = 4000;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="relative flex h-full w-full items-center justify-center bg-background px-6"
    >
      <div className="relative h-32 w-full max-w-3xl">
        <ul className="flex h-full w-full items-stretch gap-1.5 overflow-hidden rounded-md">
          {scenes.map((scene) => (
            <li
              key={scene.id}
              className="relative flex-1 overflow-hidden rounded-sm bg-muted"
            >
              {scene.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={scene.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute bottom-0.5 right-1 font-mono text-[10px] text-white/90 mix-blend-difference">
                {scene.scene_number}
              </div>
            </li>
          ))}
        </ul>
        {/* Playhead */}
        <div
          className="pointer-events-none absolute top-0 h-full w-0.5 bg-primary"
          style={{ left: `${progress * 100}%`, transition: "left 60ms linear" }}
        />
      </div>
    </div>
  );
}

export default FinalConcatStage;
