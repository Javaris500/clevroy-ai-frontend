"use client";

import * as React from "react";

import type { ThreadMessage } from "@/stores/chat-store";

import { ActivityMessage } from "./ActivityMessage";
import { AssemblyPreviewCard } from "./AssemblyPreviewCard";
import { CharacterRefCard } from "./CharacterRefCard";
import { FinalFilmCard } from "./FinalFilmCard";
import { NarrationMessage } from "./NarrationMessage";
import { SceneImageCard } from "./SceneImageCard";
import { ScenePlaybackCard } from "./ScenePlaybackCard";
import { SystemMessage } from "./SystemMessage";
import { UserMessage } from "./UserMessage";

/**
 * Type-dispatched message renderer. Reads `message.type` and (for assets)
 * `message.metadata.assetKind`, then delegates to the leaf component.
 *
 * Unknown types degrade silently — we don't crash a thread on an
 * unrecognized message coming from a future server-side variant. A console
 * warn surfaces it in development; production users see nothing.
 */
export interface MessageRendererProps {
  message: ThreadMessage;
  /** Optional collapsed-burst count (forwarded to ActivityMessage). */
  collapsedActivityCount?: number;
  /** Action handlers — Layer 4/5 wires these; Layer 3 leaves them as
   *  no-ops by default so the menus render but actions are inert. */
  onReshootScene?: (sceneId: string | undefined) => void;
  onViewCharacters?: () => void;
  onViewAllCharacters?: () => void;
  onTakeItHome?: () => void;
  onKeepIt?: () => void;
  onDeleteIt?: () => void;
}

export function MessageRenderer({
  message,
  collapsedActivityCount,
  onReshootScene,
  onViewCharacters,
  onViewAllCharacters,
  onTakeItHome,
  onKeepIt,
  onDeleteIt,
}: MessageRendererProps) {
  switch (message.type) {
    case "user":
      return <UserMessage message={message} />;
    case "narration":
      return <NarrationMessage message={message} />;
    case "activity":
      return (
        <ActivityMessage
          message={message}
          collapsedCount={collapsedActivityCount}
        />
      );
    case "system":
      return <SystemMessage message={message} />;
    case "asset": {
      const kind = message.metadata?.assetKind;
      switch (kind) {
        case "scene_image":
          return (
            <SceneImageCard
              message={message}
              onReshoot={onReshootScene}
              onViewCharacters={onViewCharacters}
            />
          );
        case "scene_playback":
          return (
            <ScenePlaybackCard
              message={message}
              onReshoot={onReshootScene}
              onViewCharacters={onViewCharacters}
            />
          );
        case "character_refs":
          return (
            <CharacterRefCard
              message={message}
              onViewAll={onViewAllCharacters}
            />
          );
        case "assembly_preview":
          return <AssemblyPreviewCard message={message} />;
        case "final_film":
          return (
            <FinalFilmCard
              message={message}
              filmId={message.filmId}
              onTakeItHome={onTakeItHome}
              onKeepIt={onKeepIt}
              onDeleteIt={onDeleteIt}
            />
          );
        default:
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.warn(
              `[MessageRenderer] unknown asset kind: ${String(kind)}`,
            );
          }
          return null;
      }
    }
    default:
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          `[MessageRenderer] unknown message type: ${String(message.type)}`,
        );
      }
      return null;
  }
}
