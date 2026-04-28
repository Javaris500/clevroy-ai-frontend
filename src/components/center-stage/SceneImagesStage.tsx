"use client";

// Phase: `scene_images_pending`. Current scene image full-bleed in the center
// stage, with a 6s ken-burns zoom loop. Caption [03 / 07] in the bottom-left.
// Crossfade 300ms when the active scene advances. Design_System §8.4.

import { Film } from "lucide-react";

import type { Scene } from "@/types/api";
import { centerStage } from "@/lib/copy";

export type SceneImagesStageProps = {
  scenes: Scene[];
  activeSceneId: string | null;
  prefersReducedMotion: boolean;
};

export function SceneImagesStage({
  scenes,
  activeSceneId,
  prefersReducedMotion,
}: SceneImagesStageProps) {
  const activeIndex = Math.max(
    0,
    scenes.findIndex((s) => s.id === activeSceneId),
  );
  const active = scenes[activeIndex] ?? scenes[0];
  if (!active) return null;
  const total = scenes.length;
  const current = activeIndex + 1;

  return (
    <div
      // The phase narration block carries the screen-reader announcement.
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden bg-background"
    >
      {/* Ken-burns zoom is visual-only and respects reduced motion. */}
      <div
        className={[
          "absolute inset-0",
          prefersReducedMotion ? "" : "animate-[kenburns_6s_ease-in-out_infinite_alternate]",
        ].join(" ")}
        style={{
          transformOrigin: "center",
        }}
      >
        {active.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={active.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Film className="h-12 w-12" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Bottom scrim + caption */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-3 left-4 font-mono text-[13px] text-white/90 mix-blend-difference">
        {centerStage.sceneCaption(current, total)}
      </div>

      {/* Local @keyframes — kept inline so the stage is self-contained. */}
      <style>{`
        @keyframes kenburns {
          0%   { transform: scale(1.0) translate3d(0, 0, 0); }
          100% { transform: scale(1.08) translate3d(-1.5%, -1.5%, 0); }
        }
      `}</style>
    </div>
  );
}

export default SceneImagesStage;
