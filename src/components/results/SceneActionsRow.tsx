"use client";

// Zone 2 (lower row) — per-scene three-dot menu.
//
// Why this is a separate row, not inline on Nemi's <SceneStrip> pills:
// SceneStrip pills are 44×44 buttons (CC-3 touch-target floor) and don't
// expose an `actionsSlot`. Rather than thread a per-scene popover into
// Nemi's component (cross-ownership), Kaiser renders a parallel row of
// three-dot triggers aligned visually under the strip. When Nemi exposes
// an `actionsSlot` prop in v0.2, this component collapses into that slot
// (see coordination.md → Kaiser → request to Nemi).
//
// Items per scene (Design_System §7.5):
//   - Reshoot this scene → opens ReshootSceneDialog (parent owns state)
//   - View characters    → calls onViewCharacters (Zone 3 jumps to Characters tab)
//   - Export scene       → not yet wired; rendered disabled until Stratum
//                          ships a per-scene export route (no §8 entry).
//
// Reshoot disabling per EC-G8: parent supplies `pendingSceneIds` (set of
// scene ids whose reshoot is in flight). Items for those scenes show their
// Reshoot menu item disabled with a small subline.

import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sceneActions } from "@/lib/copy";
import type { Scene } from "@/types/api";

export interface SceneActionsRowProps {
  scenes: Scene[];
  /** Reshoot is hidden when the film isn't `complete` (prevents triggering
   *  user-initiated regen on an in-progress film). */
  reshootEnabled: boolean;
  /** Scene ids currently being reshot — those scenes' Reshoot menu items
   *  are disabled (EC-G8). */
  pendingSceneIds?: ReadonlySet<string>;
  onReshoot: (scene: Scene) => void;
  onViewCharacters: (scene: Scene) => void;
  /** Optional — wired when a per-scene export route is exposed by Stratum.
   *  Until then the menu item is rendered disabled. */
  onExportScene?: (scene: Scene) => void;
}

export function SceneActionsRow({
  scenes,
  reshootEnabled,
  pendingSceneIds,
  onReshoot,
  onViewCharacters,
  onExportScene,
}: SceneActionsRowProps) {
  // Stable lookup so disabled-state checks don't re-create per render.
  const pending = useMemo(
    () => pendingSceneIds ?? new Set<string>(),
    [pendingSceneIds],
  );

  return (
    <div
      role="group"
      aria-label="Scene actions"
      className="flex items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
    >
      {scenes.map((scene) => {
        const isPending = pending.has(scene.id);
        return (
          <DropdownMenu key={scene.id}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={sceneActions.triggerAriaLabel(scene.scene_number)}
                // Same shrink/snap rhythm as the SceneStrip pill widths so
                // triggers visually align beneath each pill.
                className="h-11 w-11 shrink-0 rounded-md p-0 sm:h-14 sm:w-14"
              >
                <MoreHorizontal
                  className="size-5"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48">
              <DropdownMenuItem
                disabled={!reshootEnabled || isPending}
                onSelect={(event) => {
                  event.preventDefault();
                  if (!reshootEnabled || isPending) return;
                  onReshoot(scene);
                }}
              >
                {sceneActions.reshoot}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onViewCharacters(scene);
                }}
              >
                {sceneActions.viewCharacters}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!onExportScene}
                onSelect={(event) => {
                  event.preventDefault();
                  if (onExportScene) onExportScene(scene);
                }}
              >
                {sceneActions.exportScene}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}

export default SceneActionsRow;
