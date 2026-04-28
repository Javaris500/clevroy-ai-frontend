"use client";

// Composes the three Results zones plus the EC-G4 error banner. The page
// owns: tab state (so the SceneActionsRow "View characters" can jump Zone 3
// to that tab), the HeroPlayer ref (so SceneStrip onSceneSelect can scrub),
// and the file-not-found / restore branches (handled in page.tsx, not here).

import { useRef, useState } from "react";

import { ErrorRecoveryActions } from "@/components/reshoot/ErrorRecoveryActions";

import { HeroPlayer, type HeroPlayerHandle } from "./HeroPlayer";
import { ZoneThree, type ResultsTabKey } from "./ZoneThree";
import { ZoneTwo } from "./ZoneTwo";
import type { FilmDetails } from "./types";

export interface ResultsViewProps {
  film: FilmDetails;
}

export function ResultsView({ film }: ResultsViewProps) {
  const playerRef = useRef<HeroPlayerHandle | null>(null);
  const [tab, setTab] = useState<ResultsTabKey>("script");

  const isComplete = film.state === "complete";
  const isError = film.state === "error";
  const failedScene = isError
    ? (film.scenes.find((s) => s.state === "failed") ?? null)
    : null;

  const onViewCharacters = () => setTab("characters");

  return (
    <div className="space-y-10">
      {failedScene ? (
        <ErrorRecoveryActions
          filmId={film.id}
          failedSceneId={failedScene.id}
          failedSceneNumber={failedScene.scene_number}
          // "Continue without it" stays hidden until the backend exposes a
          // finish-incomplete route (see coordination.md → Kaiser open Q1).
        />
      ) : null}

      {/* Layout_Enhancements A.14 — bottom strip on mobile, right rail on
          desktop. Container-query breakpoint anchors to PagePanel's
          @container/page so a squeezed panel keeps the strip stacked. The
          strip itself stays horizontally-scrolling inside its column today;
          nemi.6 adds a `direction='vertical'` prop for a true rail layout. */}
      <div className="grid gap-6 @5xl/page:grid-cols-[minmax(0,1fr)_320px]">
        <HeroPlayer ref={playerRef} film={film} exportable={isComplete} />

        <ZoneTwo
          filmId={film.id}
          scenes={film.scenes}
          filmTitle={film.title}
          playerRef={playerRef}
          reshootEnabled={isComplete}
          onViewCharacters={onViewCharacters}
        />
      </div>

      <ZoneThree film={film} value={tab} onValueChange={setTab} />
    </div>
  );
}

export default ResultsView;
