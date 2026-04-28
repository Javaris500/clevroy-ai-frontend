"use client";

// Phase: `scene_assembly`. The assembled scene plays muted in the center
// stage, once, then holds on the final frame until the next scene is ready.
// Design_System §8.4.

import { useEffect, useRef } from "react";

import type { Scene } from "@/types/api";

export type SceneAssemblyStageProps = {
  scene: Scene | null;
};

export function SceneAssemblyStage({ scene }: SceneAssemblyStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {
      // Autoplay can fail under strict policies — that's fine, the poster
      // image (the scene's still) remains visible.
    });
  }, [scene?.id]);

  return (
    <div aria-hidden="true" className="relative h-full w-full overflow-hidden bg-background">
      {scene?.clip_url ? (
        <video
          ref={videoRef}
          src={scene.clip_url}
          poster={scene.image_url ?? undefined}
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
      ) : scene?.image_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={scene.image_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
    </div>
  );
}

export default SceneAssemblyStage;
