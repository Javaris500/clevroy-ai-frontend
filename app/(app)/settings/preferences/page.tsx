"use client";

// Settings → Preferences. Pure autosave: every interaction debounces to a
// real onSave (UI store / create-options store) and surfaces a toast. The
// shell's last-saved indicator updates on every successful save.

import * as React from "react";
import { Check } from "lucide-react";

import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Switch } from "@/components/ui/switch";
import { useAutosave } from "@/hooks/use-autosave";
import { settingsPreferences } from "@/lib/copy";
import { cn } from "@/lib/utils";
import {
  ASPECTS,
  STYLE_PRESETS,
  useAspect,
  useSetAspect,
  useSetStyle,
  useStyle,
  type Aspect,
  type StylePreset,
} from "@/stores/create-options-store";
import { useUIStore, type ThemePreference } from "@/stores/ui-store";

// ---------------------------------------------------------------------------
// Theme preview cards — small, faithful color swatches for each theme.
// Inline styles keep the mini-mockup independent of the global .dark class.
// ---------------------------------------------------------------------------

const THEME_PALETTES = {
  light: {
    bg: "#FAF9F5",
    card: "#FFFFFF",
    border: "#E8E5DC",
    fg: "#1A1A1A",
    muted: "#6F6B5F",
    primary: "#C1272D",
  },
  dark: {
    bg: "#0F0F0F",
    card: "#1F1F1F",
    border: "#2A2A2A",
    fg: "#F4F1EB",
    muted: "#8A8580",
    primary: "#C1272D",
  },
} as const;

function ThemeMiniature({ palette }: { palette: keyof typeof THEME_PALETTES }) {
  const p = THEME_PALETTES[palette];
  return (
    <div
      className="aspect-[16/10] w-full overflow-hidden rounded-lg"
      style={{ background: p.bg, color: p.fg }}
    >
      <div className="flex h-full flex-col p-3">
        <div
          className="rounded-md px-2 py-1.5"
          style={{ background: p.card, border: `1px solid ${p.border}` }}
        >
          <div
            className="h-1.5 w-1/2 rounded-full"
            style={{ background: p.muted, opacity: 0.5 }}
          />
        </div>
        <div className="mt-2 flex flex-1 items-center gap-1.5">
          <div
            className="h-1.5 flex-1 rounded-full"
            style={{ background: p.primary }}
          />
          <div
            className="h-1.5 flex-1 rounded-full"
            style={{ background: p.muted, opacity: 0.4 }}
          />
          <div
            className="h-1.5 flex-1 rounded-full"
            style={{ background: p.muted, opacity: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

function SystemMiniature() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 left-0 w-1/2">
        <ThemeMiniature palette="light" />
      </div>
      <div className="absolute inset-y-0 right-0 w-1/2">
        <ThemeMiniature palette="dark" />
      </div>
    </div>
  );
}

function PreviewCard({
  selected,
  onClick,
  ariaLabel,
  children,
  caption,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  caption?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border p-3 text-left transition-all",
        selected
          ? "border-primary shadow-md ring-2 ring-primary/30"
          : "border-border hover:border-primary/40 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      {children}
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {selected ? (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            <Check className="size-3" strokeWidth={2.5} />
            Selected
          </span>
        ) : null}
      </div>
      {caption ? (
        <p className="-mt-2 text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Theme section
// ---------------------------------------------------------------------------

function ThemeSection() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  // Autosave fires on `theme` change. Theme is already persisted by the
  // store's persist middleware; the autosave is here for the toast + the
  // last-saved indicator side-effects.
  useAutosave({
    value: theme,
    onSave: () => Promise.resolve(),
    toastSuccess: (v) =>
      settingsPreferences.themeSavedToast(
        settingsPreferences.themeOptions[v].label,
      ),
  });

  const options: ReadonlyArray<ThemePreference> = ["light", "dark", "system"];

  return (
    <SettingsSection
      title={settingsPreferences.themeTitle}
      description={settingsPreferences.themeBody}
      flush
    >
      <div role="radiogroup" aria-label={settingsPreferences.themeTitle}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {options.map((key) => {
            const meta = settingsPreferences.themeOptions[key];
            const active = theme === key;
            return (
              <PreviewCard
                key={key}
                selected={active}
                onClick={() => setTheme(key)}
                ariaLabel={
                  active
                    ? settingsPreferences.themeSelectedAria(meta.label)
                    : meta.label
                }
                label={meta.label}
                caption={meta.caption}
              >
                {key === "system" ? (
                  <SystemMiniature />
                ) : (
                  <ThemeMiniature palette={key} />
                )}
              </PreviewCard>
            );
          })}
        </div>
      </div>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Reduced motion section
// ---------------------------------------------------------------------------

function MotionSection() {
  const override = useUIStore((s) => s.reducedMotionOverride);
  const setOverride = useUIStore((s) => s.setReducedMotionOverride);
  const reduceOn = override === true;

  useAutosave({
    value: reduceOn,
    onSave: () => Promise.resolve(),
    toastSuccess: (v) => settingsPreferences.motionSavedToast(v),
  });

  return (
    <SettingsSection
      title={settingsPreferences.motionTitle}
      description={settingsPreferences.motionBody}
    >
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {settingsPreferences.motionToggleLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {settingsPreferences.motionToggleHelper}
          </p>
        </div>
        <Switch
          checked={reduceOn}
          onCheckedChange={(checked) => setOverride(checked ? true : null)}
          aria-label={settingsPreferences.motionToggleLabel}
        />
      </div>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Aspect ratio section
// ---------------------------------------------------------------------------

function AspectMiniature({ ratio }: { ratio: Aspect }) {
  const aspectClass =
    ratio === "16:9"
      ? "aspect-video"
      : ratio === "9:16"
        ? "aspect-[9/16]"
        : "aspect-square";
  return (
    <div className="flex aspect-[16/10] items-center justify-center bg-muted/40 p-3">
      <div
        className={cn(
          "max-h-full max-w-full rounded-md border border-border bg-card",
          aspectClass,
        )}
        style={{ width: ratio === "9:16" ? "30%" : "70%" }}
      >
        <div className="m-2 h-1 w-1/3 rounded-full bg-primary/60" />
        <div className="mx-2 h-1 w-1/2 rounded-full bg-muted-foreground/40" />
      </div>
    </div>
  );
}

function AspectSection() {
  const aspect = useAspect();
  const setAspect = useSetAspect();

  useAutosave({
    value: aspect,
    onSave: () => Promise.resolve(),
    toastSuccess: (v) => settingsPreferences.aspectSavedToast(v),
  });

  return (
    <SettingsSection
      title={settingsPreferences.aspectTitle}
      description={settingsPreferences.aspectBody}
    >
      <div role="radiogroup" aria-label={settingsPreferences.aspectTitle}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ASPECTS.map((key) => {
            const meta = settingsPreferences.aspectOptions[key];
            const active = aspect === key;
            return (
              <PreviewCard
                key={key}
                selected={active}
                onClick={() => setAspect(key)}
                ariaLabel={`${meta.label} aspect ratio`}
                label={meta.label}
                caption={meta.caption}
              >
                <div className="overflow-hidden rounded-lg">
                  <AspectMiniature ratio={key} />
                </div>
              </PreviewCard>
            );
          })}
        </div>
      </div>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Default style section
// ---------------------------------------------------------------------------

const STYLE_THUMB_SEED: Record<string, string> = {
  None: "clev-style-none",
  Cinematic: "clev-cinematic",
  Documentary: "clev-doc",
  Noir: "clev-noir",
  Animated: "clev-animated",
};

function StyleMiniature({ style }: { style: StylePreset | "None" }) {
  const seed = STYLE_THUMB_SEED[style] ?? "clev-default";
  return (
    <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://picsum.photos/seed/${seed}/320/200`}
        alt=""
        className="size-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function StyleSection() {
  const style = useStyle();
  const setStyle = useSetStyle();

  // Selected key in the UI: null → "None"
  const current: StylePreset | "None" = style ?? "None";

  useAutosave({
    value: current,
    onSave: () => Promise.resolve(),
    toastSuccess: (v) =>
      settingsPreferences.styleSavedToast(
        settingsPreferences.styleOptions[v].label,
      ),
  });

  const options: ReadonlyArray<StylePreset | "None"> = ["None", ...STYLE_PRESETS];

  return (
    <SettingsSection
      title={settingsPreferences.styleTitle}
      description={settingsPreferences.styleBody}
    >
      <div role="radiogroup" aria-label={settingsPreferences.styleTitle}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {options.map((key) => {
            const meta = settingsPreferences.styleOptions[key];
            const active = current === key;
            return (
              <PreviewCard
                key={key}
                selected={active}
                onClick={() => setStyle(key === "None" ? null : key)}
                ariaLabel={meta.label}
                label={meta.label}
                caption={meta.caption}
              >
                <StyleMiniature style={key} />
              </PreviewCard>
            );
          })}
        </div>
      </div>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Language (read-only)
// ---------------------------------------------------------------------------

function LanguageSection() {
  return (
    <SettingsSection
      title={settingsPreferences.languageTitle}
      description={settingsPreferences.languageBody}
    >
      <SettingsField label="Language" compact>
        <p className="text-sm font-medium text-foreground">
          {settingsPreferences.languageOnly}
        </p>
      </SettingsField>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPreferencesPage() {
  return (
    <div>
      <ThemeSection />
      <MotionSection />
      <AspectSection />
      <StyleSection />
      <LanguageSection />
    </div>
  );
}
