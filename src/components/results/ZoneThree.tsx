"use client";

// Zone 3 — tabs wrapping Script / Characters / Voice & Music / Metadata.
// Tab state is controlled by the page so Zone 2's three-dot "View characters"
// can jump here.

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resultsTabs } from "@/lib/copy";

import { CharactersTab } from "./tabs/CharactersTab";
import { MetadataTab } from "./tabs/MetadataTab";
import { ScriptTab } from "./tabs/ScriptTab";
import { VoiceMusicTab } from "./tabs/VoiceMusicTab";
import type { FilmDetails } from "./types";

export type ResultsTabKey = "script" | "characters" | "voiceMusic" | "metadata";

export interface ZoneThreeProps {
  film: FilmDetails;
  /** Controlled tab state — when omitted, Tabs goes uncontrolled with
   *  defaultValue="script". */
  value?: ResultsTabKey;
  onValueChange?: (value: ResultsTabKey) => void;
}

const TAB_ORDER: ReadonlyArray<{ key: ResultsTabKey; label: string }> = [
  { key: "script", label: resultsTabs.script },
  { key: "characters", label: resultsTabs.characters },
  { key: "voiceMusic", label: resultsTabs.voiceMusic },
  { key: "metadata", label: resultsTabs.metadata },
];

export function ZoneThree({ film, value, onValueChange }: ZoneThreeProps) {
  return (
    <Tabs
      defaultValue="script"
      value={value}
      onValueChange={(next) => onValueChange?.(next as ResultsTabKey)}
      className="space-y-4"
    >
      <TabsList className="flex h-auto flex-wrap">
        {TAB_ORDER.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="script">
        <ScriptTab
          scenes={film.scenes}
          characters={film.characters}
          dialogue_lines={film.dialogue_lines}
        />
      </TabsContent>
      <TabsContent value="characters">
        <CharactersTab characters={film.characters} />
      </TabsContent>
      <TabsContent value="voiceMusic">
        <VoiceMusicTab
          characters={film.characters}
          dialogue_lines={film.dialogue_lines}
          stylePreset={film.style_preset}
        />
      </TabsContent>
      <TabsContent value="metadata">
        <MetadataTab film={film} />
      </TabsContent>
    </Tabs>
  );
}

export default ZoneThree;
