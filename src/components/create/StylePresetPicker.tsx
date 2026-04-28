"use client";

// Single-select row of preset cards. Picking one tints the card with
// --color-primary-soft and bolds the label. Design_System §7.4.

import { Check } from "lucide-react";

import {
  createPage,
  stylePresets,
  type StylePresetId,
} from "@/lib/copy";

export type StylePresetPickerProps = {
  value: StylePresetId | null;
  onChange: (next: StylePresetId) => void;
};

export function StylePresetPicker({ value, onChange }: StylePresetPickerProps) {
  return (
    <fieldset
      role="radiogroup"
      aria-label={createPage.styleSectionTitle}
      className="space-y-3"
    >
      <legend className="space-y-1">
        <span className="text-h3 block">{createPage.styleSectionTitle}</span>
        <span className="text-small text-muted-foreground">
          {createPage.styleSectionHelp}
        </span>
      </legend>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stylePresets.map((preset) => {
          const selected = preset.id === value;
          return (
            <li key={preset.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(preset.id)}
                className={[
                  "group flex h-full w-full flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
                  // 44px floor — these cards are taller than 44px naturally,
                  // but enforce the touch-target rule via padding + min-height
                  // for screen readers / motor accessibility (CC-3).
                  "min-h-[88px]",
                  selected
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-card hover:bg-accent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                ].join(" ")}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={[
                      "text-body",
                      selected ? "font-semibold text-foreground" : "text-foreground",
                    ].join(" ")}
                  >
                    {preset.label}
                  </span>
                  {selected ? (
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Check className="h-3 w-3" strokeWidth={2} />
                    </span>
                  ) : null}
                </div>
                <p className="text-small text-muted-foreground">{preset.caption}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export default StylePresetPicker;
