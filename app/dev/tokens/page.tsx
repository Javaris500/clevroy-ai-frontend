"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUIStore, type ThemePreference } from "@/stores/ui-store";

/**
 * /dev/tokens — visual token inventory.
 *
 * Renders every design token from UI_Design_System §2–§3 (colors, radii,
 * spacing, shadows, motion, typography) plus the 9-phase narration samples
 * from §8.3. Used by Axios to verify fidelity before other agents build on top.
 */

const COLOR_TOKENS = [
  // shadcn base
  { name: "background", hexDark: "#0D0D0D", hexLight: "#F5EFE6" },
  { name: "foreground", hexDark: "#F5EFE6", hexLight: "#1A1A1A" },
  { name: "card", hexDark: "#161616", hexLight: "#FBF7F0" },
  { name: "card-foreground", hexDark: "#F5EFE6", hexLight: "#1A1A1A" },
  { name: "popover", hexDark: "#1F1F1F", hexLight: "#FFFFFF" },
  { name: "popover-foreground", hexDark: "#F5EFE6", hexLight: "#1A1A1A" },
  { name: "primary", hexDark: "#C1272D", hexLight: "#C1272D" },
  { name: "primary-foreground", hexDark: "#F5EFE6", hexLight: "#F5EFE6" },
  { name: "secondary", hexDark: "#1F1F1F", hexLight: "#EAE2D4" },
  { name: "secondary-foreground", hexDark: "#F5EFE6", hexLight: "#1A1A1A" },
  { name: "muted", hexDark: "#161616", hexLight: "#EAE2D4" },
  { name: "muted-foreground", hexDark: "#9A9A9A", hexLight: "#6A6359" },
  { name: "accent", hexDark: "#1F1F1F", hexLight: "#EAE2D4" },
  { name: "accent-foreground", hexDark: "#F5EFE6", hexLight: "#1A1A1A" },
  { name: "destructive", hexDark: "#C1272D", hexLight: "#C1272D" },
  { name: "destructive-foreground", hexDark: "#F5EFE6", hexLight: "#F5EFE6" },
  { name: "border", hexDark: "#262626", hexLight: "#D9D2C4" },
  { name: "input", hexDark: "#262626", hexLight: "#D9D2C4" },
  { name: "ring", hexDark: "#C1272D", hexLight: "#C1272D" },
  // clevroy extensions
  { name: "shell", hexDark: "#050505", hexLight: "#EAE2D4" },
  { name: "panel-elev", hexDark: "#1F1F1F", hexLight: "#FFFFFF" },
  { name: "primary-hover", hexDark: "#8F1D22", hexLight: "#8F1D22" },
  { name: "primary-soft", hexDark: "rgba(193,39,45,0.15)", hexLight: "rgba(193,39,45,0.10)" },
  { name: "success", hexDark: "#2F7D5C", hexLight: "#2F7D5C" },
  { name: "warning", hexDark: "#C88A2C", hexLight: "#C88A2C" }
] as const;

const RADIUS_TOKENS = [
  { name: "sm", value: "6px", use: "inputs, small badges" },
  { name: "md", value: "10px", use: "buttons, inline chips" },
  { name: "lg", value: "12px", use: "panels, cards — signature" },
  { name: "xl", value: "16px", use: "outer shell frame" },
  { name: "2xl", value: "24px", use: "hero cards, book cover" },
  { name: "full", value: "9999px", use: "avatars, pill badges" }
] as const;

const TYPE_SAMPLES = [
  { util: "text-display-xl", label: "Display XL — 72/80", sample: "Your script. On screen. Now." },
  { util: "text-display-lg", label: "Display L — 56/64", sample: "Your script. On screen. Now." },
  { util: "text-display-md", label: "Display M — 48/56", sample: "Your script. On screen. Now." },
  { util: "text-h1", label: "H1 — 32/40", sample: "Your Films" },
  { util: "text-h2", label: "H2 — 24/32", sample: "Recent films" },
  { util: "text-h3", label: "H3 — 20/28", sample: "Maya, 32" },
  { util: "text-body-lg", label: "Body L — 18/28", sample: "Watch your story shoot itself." },
  { util: "text-body", label: "Body — 16/24", sample: "Paste a script and we'll start shooting." },
  { util: "text-body-md", label: "Body M — 15/22", sample: "Sidebar items, form helpers." },
  { util: "text-small", label: "Small — 14/20", sample: "Created April 24, 2026" },
  { util: "text-caption", label: "Caption — 12/16", sample: "Films left" },
  { util: "text-mono", label: "Mono — 13/20", sample: "film_7f3a2b1e" },
  { util: "text-phase", label: "Phase narration — 28/36", sample: "Blocking the scenes…" }
] as const;

const PHASE_SAMPLES = [
  { state: "parsing", copy: "Reading your script…", sub: "Understanding your story, scene by scene." },
  { state: "cie_building", copy: "Assembling the cast…", sub: "Figuring out who's in your film." },
  { state: "character_refs", copy: "Casting portraits…", sub: "Generating reference portraits so faces stay consistent across scenes." },
  { state: "scene_images_pending", copy: "Blocking the scenes…", sub: "Working on scene 3 of 7." },
  { state: "voice_synthesis", copy: "Finding voices…", sub: "Recording dialogue lines with ElevenLabs." },
  { state: "music_composition", copy: "Scoring the film…", sub: "Composing a soundtrack in the Cinematic style." },
  { state: "scene_assembly", copy: "Cutting scene 3…", sub: "Putting picture, voice, and score together." },
  { state: "final_concat", copy: "Final cut…", sub: "Stitching your film into one take." },
  { state: "complete", copy: "Your film is ready.", sub: "Take a look." }
] as const;

export default function TokensPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const reducedMotionOverride = useUIStore((s) => s.reducedMotionOverride);
  const setReducedMotionOverride = useUIStore((s) => s.setReducedMotionOverride);

  const [resolved, setResolved] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const update = () =>
      setResolved(document.documentElement.classList.contains("light") ? "light" : "dark");
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto max-w-6xl space-y-16 px-6 py-12">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-caption text-[var(--color-muted-foreground)]">
            Design system
          </p>
          <h1 className="text-display-md">Token inventory</h1>
          <p className="text-body-lg text-[var(--color-muted-foreground)]">
            Every locked token from the Brand Guide §2 and Design System §2–§3.
            Flip between dark and light to verify both variants.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <ThemeButton
              label="Dark"
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
            />
            <ThemeButton
              label="Light"
              active={theme === "light"}
              onClick={() => setTheme("light")}
            />
            <ThemeButton
              label="System"
              active={theme === "system"}
              onClick={() => setTheme("system")}
            />
            <Separator orientation="vertical" className="h-8" />
            <label className="flex items-center gap-2 text-small text-[var(--color-muted-foreground)]">
              <input
                type="checkbox"
                checked={reducedMotionOverride === true}
                onChange={(e) =>
                  setReducedMotionOverride(e.target.checked ? true : null)
                }
              />
              Force reduced motion
            </label>
            <Badge variant="outline" className="ml-auto text-mono">
              resolved: {resolved}
            </Badge>
          </div>
        </header>

        {/* Colors */}
        <section className="space-y-6">
          <SectionHeading>Colors</SectionHeading>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_TOKENS.map((t) => (
              <ColorSwatch
                key={t.name}
                name={t.name}
                hexDark={t.hexDark}
                hexLight={t.hexLight}
                resolved={resolved}
              />
            ))}
          </div>
        </section>

        {/* Radius */}
        <section className="space-y-6">
          <SectionHeading>Radius</SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {RADIUS_TOKENS.map((r) => (
              <div key={r.name} className="space-y-2">
                <div
                  className="h-24 w-full border border-[var(--color-border)] bg-[var(--color-card)]"
                  style={{ borderRadius: `var(--radius-${r.name})` }}
                />
                <div>
                  <div className="text-small font-medium">--radius-{r.name}</div>
                  <div className="text-caption text-[var(--color-muted-foreground)]">
                    {r.value}
                  </div>
                  <div className="text-caption text-[var(--color-muted-foreground)]">
                    {r.use}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section className="space-y-6">
          <SectionHeading>Spacing</SectionHeading>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <SpacingRow name="--spacing-shell-gap" value="12px" />
              <SpacingRow name="--spacing-safe-top" value="env(safe-area-inset-top)" />
              <SpacingRow name="--spacing-safe-bottom" value="env(safe-area-inset-bottom)" />
              <SpacingRow name="--spacing-safe-left" value="env(safe-area-inset-left)" />
              <SpacingRow name="--spacing-safe-right" value="env(safe-area-inset-right)" />
            </CardContent>
          </Card>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <SectionHeading>Typography</SectionHeading>
          <Card>
            <CardContent className="divide-y divide-[var(--color-border)] p-0">
              {TYPE_SAMPLES.map((t) => (
                <div
                  key={t.util}
                  className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <div className="w-48 shrink-0 text-mono text-[var(--color-muted-foreground)]">
                    {t.util}
                    <div className="text-caption text-[var(--color-muted-foreground)]">
                      {t.label}
                    </div>
                  </div>
                  <div className={t.util}>{t.sample}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Motion */}
        <section className="space-y-6">
          <SectionHeading>Motion</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MotionDemo name="--duration-fast" value="150ms" />
            <MotionDemo name="--duration-base" value="200ms" />
            <MotionDemo name="--duration-slow" value="300ms" />
            <MotionDemo name="--duration-phase" value="450ms" />
          </div>
          <div className="text-small text-[var(--color-muted-foreground)]">
            Easing: <span className="text-mono">--ease-out</span>{" "}
            cubic-bezier(0.16, 1, 0.3, 1) ·{" "}
            <span className="text-mono">--ease-in-out</span>{" "}
            cubic-bezier(0.65, 0, 0.35, 1). Reduced motion collapses the first
            three durations to 0 and clamps <span className="text-mono">--duration-phase</span>{" "}
            to 150ms.
          </div>
        </section>

        {/* Shadows */}
        <section className="space-y-6">
          <SectionHeading>Shadows (light mode only)</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-[var(--radius-lg)] bg-[var(--color-card)] p-8 text-small"
              style={{ boxShadow: "var(--shadow-panel)" }}
            >
              --shadow-panel
            </div>
            <div
              className="rounded-[var(--radius-lg)] bg-[var(--color-popover)] p-8 text-small"
              style={{ boxShadow: "var(--shadow-popover)" }}
            >
              --shadow-popover
            </div>
          </div>
          <p className="text-small text-[var(--color-muted-foreground)]">
            In dark mode, shadows are never applied — depth is expressed through
            hairline borders and the --color-card → --color-popover step.
          </p>
        </section>

        {/* Phase narration */}
        <section className="space-y-6">
          <SectionHeading>Phase narration (UI_Design_System §8.3)</SectionHeading>
          <Card>
            <CardContent className="divide-y divide-[var(--color-border)] p-0">
              {PHASE_SAMPLES.map((p) => (
                <div
                  key={p.state}
                  className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center"
                >
                  <Badge variant="outline" className="text-mono sm:w-56">
                    {p.state}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <div className="text-phase">{p.copy}</div>
                    <div className="text-body text-[var(--color-muted-foreground)]">
                      {p.sub}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Components */}
        <section className="space-y-6">
          <SectionHeading>Essentials sanity check</SectionHeading>
          <Card>
            <CardHeader>
              <CardTitle>Button variants</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>Start your film</Button>
              <Button variant="secondary">Keep going</Button>
              <Button variant="outline">Cancel</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete it</Button>
              <Button variant="link">Take it home</Button>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-[var(--color-border)] pt-8 text-small text-[var(--color-muted-foreground)]">
          Token values sourced from Brand_Guide §2.1–§2.3 and
          UI_Design_System §2.1–§2.5, §3. Changes here must be reviewed
          against both docs before merging.
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-3">
      <h2 className="text-h2">{children}</h2>
    </div>
  );
}

function ThemeButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {label}
    </Button>
  );
}

function ColorSwatch({
  name,
  hexDark,
  hexLight,
  resolved
}: {
  name: string;
  hexDark: string;
  hexLight: string;
  resolved: "light" | "dark";
}) {
  return (
    <div className="space-y-2">
      <div
        className="h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-border)]"
        style={{ backgroundColor: `var(--color-${name})` }}
      />
      <div>
        <div className="text-small font-medium">--color-{name}</div>
        <div className="text-caption text-[var(--color-muted-foreground)]">
          {resolved === "dark" ? hexDark : hexLight}
        </div>
      </div>
    </div>
  );
}

function SpacingRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-56 text-mono text-small">{name}</div>
      <div
        className="h-3 bg-[var(--color-primary-soft)]"
        style={{ width: name === "--spacing-shell-gap" ? "12px" : "12px" }}
      />
      <div className="text-small text-[var(--color-muted-foreground)]">{value}</div>
    </div>
  );
}

function MotionDemo({ name, value }: { name: string; value: string }) {
  const [toggled, setToggled] = useState(false);
  return (
    <button
      onClick={() => setToggled((t) => !t)}
      className="flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left"
    >
      <div className="w-full">
        <div className="text-mono text-small">{name}</div>
        <div className="text-caption text-[var(--color-muted-foreground)]">{value}</div>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-muted)]">
        <div
          className="h-full bg-[var(--color-primary)]"
          style={{
            width: toggled ? "100%" : "10%",
            transitionProperty: "width",
            transitionDuration: `var(${name})`,
            transitionTimingFunction: "var(--ease-out)"
          }}
        />
      </div>
      <div className="text-caption text-[var(--color-muted-foreground)]">
        Tap to animate
      </div>
    </button>
  );
}
