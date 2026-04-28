"use client";

// Phase: `complete`. First frame of the finished film as a poster, with a
// red Play button overlaid. Tapping starts the player. For MVP the click
// hands off to the Results page (Kaiser owns the player).

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Scene } from "@/types/api";
import { centerStage } from "@/lib/copy";

export type CompleteStageProps = {
  filmId: string | null;
  scenes: Scene[];
};

export function CompleteStage({ filmId, scenes }: CompleteStageProps) {
  const router = useRouter();
  const poster = scenes[0]?.image_url ?? null;

  const handlePlay = () => {
    if (filmId) {
      router.push(`/films/${filmId}`);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {poster ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={poster} alt="" className="h-full w-full object-cover" aria-hidden="true" />
      ) : (
        <div aria-hidden="true" className="h-full w-full bg-muted" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={centerStage.playFilmAria}
          // Auto-receives focus on completion per CC-5 (handled by CenterStage).
          className="group flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Play className="ml-1 h-9 w-9" strokeWidth={1.5} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

export default CompleteStage;
