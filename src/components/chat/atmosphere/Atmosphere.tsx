"use client";

import { CueMarks } from "./CueMarks";
import { Grain } from "./Grain";
import { Letterbox } from "./Letterbox";
import { Timecode } from "./Timecode";

/**
 * Cinematic chrome that wraps the entire chat surface — mounted once
 * by the (chat) route group's layout. Each piece is independent so it
 * can be toggled or removed without touching the others.
 */
export function Atmosphere() {
  return (
    <>
      <Grain />
      <CueMarks />
      <Timecode />
      <Letterbox />
    </>
  );
}
