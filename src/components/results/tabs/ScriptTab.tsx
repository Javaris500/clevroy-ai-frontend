"use client";

// Zone 3 — Script tab. Renders the parsed script with scene break markers.
// Design_System §7.5 says "scene breaks highlighted." Since the backend stores
// the raw script in `films.script_text` and the parsed breakdown in `scenes`,
// the display strategy is:
//   - Each scene rendered as its own block: number badge + location + body.
//   - Body = scene.description (the parser's per-scene narration).
//   - Inline dialogue lines listed under their scene, prefixed by the
//     character's name in caps.
// This reads like a simplified screenplay rather than a verbatim dump of
// `script_text`, which fits the "Final cut" framing on the Results page.

import type { Character, DialogueLine, Scene } from "@/types/api";
import { resultsTabs } from "@/lib/copy";

export interface ScriptTabProps {
  scenes: Scene[];
  characters: Character[];
  dialogue_lines: DialogueLine[];
}

export function ScriptTab({ scenes, characters, dialogue_lines }: ScriptTabProps) {
  if (scenes.length === 0) {
    return (
      <p className="text-body text-muted-foreground">
        {resultsTabs.scriptEmpty}
      </p>
    );
  }

  const charById = new Map(characters.map((c) => [c.id, c] as const));
  const linesByScene = new Map<string, DialogueLine[]>();
  for (const line of dialogue_lines) {
    const list = linesByScene.get(line.scene_id) ?? [];
    list.push(line);
    linesByScene.set(line.scene_id, list);
  }
  for (const list of linesByScene.values()) {
    list.sort((a, b) => a.line_number - b.line_number);
  }

  return (
    <div className="space-y-8">
      {scenes.map((scene) => {
        const lines = linesByScene.get(scene.id) ?? [];
        return (
          <article
            key={scene.id}
            aria-labelledby={`script-scene-${scene.scene_number}`}
            className="space-y-3 border-l-2 border-border pl-4"
          >
            <header className="flex items-baseline gap-3">
              <span className="text-caption uppercase tracking-wider text-muted-foreground">
                Scene {scene.scene_number}
              </span>
              {scene.location ? (
                <span className="text-small font-mono text-muted-foreground">
                  {scene.location}
                </span>
              ) : null}
            </header>
            <h3
              id={`script-scene-${scene.scene_number}`}
              className="text-body"
            >
              {scene.description}
            </h3>
            {lines.length > 0 ? (
              <dl className="space-y-2">
                {lines.map((line) => {
                  const speaker = charById.get(line.character_id);
                  return (
                    <div key={line.id} className="space-y-0.5">
                      <dt className="text-caption uppercase tracking-wider text-muted-foreground">
                        {speaker?.name ?? "—"}
                      </dt>
                      <dd className="text-body">{line.text}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export default ScriptTab;
