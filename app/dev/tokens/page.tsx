"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/ui-store";

/**
 * /dev/tokens — Theme v2 visual inventory.
 *
 * Renders every token from docs/Clevroy_Theme_v2.css (with the three
 * Brand_Guide §4.2 font overrides), the typography scale from
 * UI_Design_System §3, motion + spacing extensions, and the nine-row
 * phase narration table. Used by Axios to verify v2 fidelity before
 * other agents build on top.
 */

type ColorRow = { name: string; group: "shadcn" | "sidebar" | "chart" | "clevroy" };

const COLOR_TOKENS: ColorRow[] = [
  { name: "background", group: "shadcn" },
  { name: "foreground", group: "shadcn" },
  { name: "card", group: "shadcn" },
  { name: "card-foreground", group: "shadcn" },
  { name: "popover", group: "shadcn" },
  { name: "popover-foreground", group: "shadcn" },
  { name: "primary", group: "shadcn" },
  { name: "primary-foreground", group: "shadcn" },
  { name: "secondary", group: "shadcn" },
  { name: "secondary-foreground", group: "shadcn" },
  { name: "muted", group: "shadcn" },
  { name: "muted-foreground", group: "shadcn" },
  { name: "accent", group: "shadcn" },
  { name: "accent-foreground", group: "shadcn" },
  { name: "destructive", group: "shadcn" },
  { name: "destructive-foreground", group: "shadcn" },
  { name: "border", group: "shadcn" },
  { name: "input", group: "shadcn" },
  { name: "ring", group: "shadcn" },
  { name: "sidebar", group: "sidebar" },
  { name: "sidebar-foreground", group: "sidebar" },
  { name: "sidebar-primary", group: "sidebar" },
  { name: "sidebar-primary-foreground", group: "sidebar" },
  { name: "sidebar-accent", group: "sidebar" },
  { name: "sidebar-accent-foreground", group: "sidebar" },
  { name: "sidebar-border", group: "sidebar" },
  { name: "sidebar-ring", group: "sidebar" },
  { name: "chart-1", group: "chart" },
  { name: "chart-2", group: "chart" },
  { name: "chart-3", group: "chart" },
  { name: "chart-4", group: "chart" },
  { name: "chart-5", group: "chart" },
  { name: "primary-hover", group: "clevroy" },
  { name: "primary-soft", group: "clevroy" },
  { name: "success", group: "clevroy" },
  { name: "warning", group: "clevroy" }
];

const RADIUS_TOKENS = [
  { name: "sm", expr: "calc(var(--radius) - 4px)", use: "inputs, badges" },
  { name: "md", expr: "calc(var(--radius) - 2px)", use: "buttons, chips" },
  { name: "lg", expr: "var(--radius) = 0.75rem (12px)", use: "panels, cards — signature" },
  { name: "xl", expr: "calc(var(--radius) + 4px)", use: "outer shell frame" },
  { name: "2xl", expr: "calc(var(--radius) + 12px)", use: "hero cards" },
  { name: "full", expr: "9999px", use: "avatars, pill badges" }
];

const TYPE_SAMPLES = [
  { util: "text-display-xl", label: "Display XL — 72/80 Fraunces", sample: "Your script. On screen. Now." },
  { util: "text-display-lg", label: "Display L — 56/64 Fraunces", sample: "Your script. On screen. Now." },
  { util: "text-display-md", label: "Display M — 48/56 Fraunces", sample: "Your script. On screen. Now." },
  { util: "text-h1", label: "H1 — 32/40 Inter 600", sample: "Your Films" },
  { util: "text-h2", label: "H2 — 24/32 Inter 600", sample: "Recent films" },
  { util: "text-h3", label: "H3 — 20/28 Inter 600", sample: "Maya, 32" },
  { util: "text-body-lg", label: "Body L — 18/28 Inter", sample: "Watch your story shoot itself." },
  { util: "text-body", label: "Body — 16/24 Inter", sample: "Paste a script and we'll start shooting." },
  { util: "text-body-md", label: "Body M — 15/22 Inter", sample: "Sidebar items, form helpers." },
  { util: "text-small", label: "Small — 14/20 Inter", sample: "Created April 24, 2026" },
  { util: "text-caption", label: "Caption — 12/16 Inter +0.08em", sample: "Films left" },
  { util: "text-mono", label: "Mono — 13/20 JetBrains Mono", sample: "film_7f3a2b1e" },
  { util: "text-phase", label: "Phase narration — 28/36 Fraunces italic", sample: "Blocking the scenes…" }
] as const;

const PHASE_SAMPLES = [
  { state: "parsing", copy: "Reading your script…", sub: "Understanding your story, scene by scene." },
  { state: "cie_building", copy: "Assembling the cast…", sub: "Figuring out who's in your film." },
  { state: "character_refs", copy: "Casting portraits…", sub: "Painting reference portraits so faces stay consistent across scenes." },
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

  const [resolved, setResolved] = useState<"light" | "dark">("light");
  useEffect(() => {
    const update = () =>
      setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light");
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const grouped = (g: ColorRow["group"]) => COLOR_TOKENS.filter((t) => t.group === g);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-16 px-6 py-12">
        <header className="space-y-3">
          <p className="text-caption text-muted-foreground">Design system · Theme v2</p>
          <h1 className="text-display-md">Token inventory</h1>
          <p className="text-body-lg text-muted-foreground">
            Every token from <code className="text-mono">docs/Clevroy_Theme_v2.css</code>{" "}
            (with Fraunces + JetBrains Mono restored over v2's Georgia/Menlo
            defaults — Brand_Guide §4.2). Flip light / dark to verify both
            variants paint correctly.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <ThemeButton label="Light" active={theme === "light"} onClick={() => setTheme("light")} />
            <ThemeButton label="Dark" active={theme === "dark"} onClick={() => setTheme("dark")} />
            <ThemeButton label="System" active={theme === "system"} onClick={() => setTheme("system")} />
            <Separator orientation="vertical" className="h-8" />
            <label className="flex items-center gap-2 text-small text-muted-foreground">
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

        <section className="space-y-6">
          <SectionHeading>Font pairing (override of v2 defaults)</SectionHeading>
          <div className="grid gap-4 md:grid-cols-3">
            <FontCard
              label="Inter"
              role="--font-sans"
              cssFamily="var(--font-sans)"
              sample="Aa 0123456789 — Watch your story shoot itself."
              note="UI body, buttons, labels."
            />
            <FontCard
              label="Fraunces"
              role="--font-serif"
              cssFamily="var(--font-serif)"
              italicSample="Reading your script…"
              sample="Your script. On screen. Now."
              note="Display, book chapters, phase narration. Overrides v2's Georgia."
            />
            <FontCard
              label="JetBrains Mono"
              role="--font-mono"
              cssFamily="var(--font-mono)"
              sample="film_7f3a2b1e · ERR_503"
              note="IDs, mono. Overrides v2's Menlo."
            />
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading>Colors — shadcn base</SectionHeading>
          <ColorGrid rows={grouped("shadcn")} />
        </section>

        <section className="space-y-6">
          <SectionHeading>Colors — sidebar (v2, sidebar-07)</SectionHeading>
          <ColorGrid rows={grouped("sidebar")} />
        </section>

        <section className="space-y-6">
          <SectionHeading>Colors — chart series</SectionHeading>
          <ColorGrid rows={grouped("chart")} />
        </section>

        <section className="space-y-6">
          <SectionHeading>Colors — Clevroy extensions</SectionHeading>
          <ColorGrid rows={grouped("clevroy")} />
        </section>

        <section className="space-y-6">
          <SectionHeading>Radius (derived from --radius)</SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {RADIUS_TOKENS.map((r) => (
              <div key={r.name} className="space-y-2">
                <div
                  className="h-24 w-full border bg-card"
                  style={{
                    borderRadius:
                      r.name === "full" ? "9999px" : `var(--radius-${r.name})`
                  }}
                />
                <div>
                  <div className="text-small font-medium">--radius-{r.name}</div>
                  <div className="text-caption text-muted-foreground">{r.expr}</div>
                  <div className="text-caption text-muted-foreground">{r.use}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading>Spacing extensions</SectionHeading>
          <Card>
            <CardContent className="space-y-4 pt-6 text-small">
              <SpacingRow name="--spacing-shell-gap" value="12px" />
              <SpacingRow name="--spacing-safe-top" value="env(safe-area-inset-top)" />
              <SpacingRow name="--spacing-safe-bottom" value="env(safe-area-inset-bottom)" />
              <SpacingRow name="--spacing-safe-left" value="env(safe-area-inset-left)" />
              <SpacingRow name="--spacing-safe-right" value="env(safe-area-inset-right)" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionHeading>Typography</SectionHeading>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {TYPE_SAMPLES.map((t) => (
                <div
                  key={t.util}
                  className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <div className="w-56 shrink-0 text-mono text-muted-foreground">
                    {t.util}
                    <div className="text-caption text-muted-foreground">{t.label}</div>
                  </div>
                  <div className={t.util}>{t.sample}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionHeading>Motion (Global_Design_Rules §3)</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MotionDemo name="--duration-fast" value="150ms" />
            <MotionDemo name="--duration-base" value="200ms" />
            <MotionDemo name="--duration-slow" value="300ms" />
            <MotionDemo name="--duration-phase" value="450ms" />
          </div>
          <div className="text-small text-muted-foreground">
            Easing: <span className="text-mono">--ease-out</span> cubic-bezier(0.16, 1, 0.3, 1) ·{" "}
            <span className="text-mono">--ease-in-out</span> cubic-bezier(0.65, 0, 0.35, 1).
            Reduced motion collapses fast/base/slow to 0 and clamps phase to 150ms.
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading>Shadows (light only — zeroed in dark)</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-card p-6 text-small shadow-sm">shadow-sm</div>
            <div className="rounded-lg bg-card p-6 text-small shadow-md">shadow-md</div>
            <div className="rounded-lg bg-card p-6 text-small shadow-lg">shadow-lg</div>
            <div className="rounded-lg bg-card p-6 text-small shadow-xl">shadow-xl</div>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading>Phase narration (UI_Design_System §8.3)</SectionHeading>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {PHASE_SAMPLES.map((p) => (
                <div
                  key={p.state}
                  className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center"
                >
                  <Badge variant="outline" className="text-mono sm:w-56">{p.state}</Badge>
                  <div className="flex-1 space-y-1">
                    <div className="text-phase">{p.copy}</div>
                    <div className="text-body text-muted-foreground">{p.sub}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionHeading>Essentials sanity check</SectionHeading>
          <Card>
            <CardHeader>
              <CardTitle>Button variants (44px default)</CardTitle>
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

        <footer className="border-t pt-8 text-small text-muted-foreground">
          Sources: <code className="text-mono">docs/Clevroy_Theme_v2.css</code>,{" "}
          <code className="text-mono">docs/Clevroy_Global_Design_Rules.md</code>,{" "}
          Brand_Guide §2 / §4.2, UI_Design_System §3.
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b pb-3">
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

function ColorGrid({ rows }: { rows: ColorRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {rows.map((row) => (
        <ColorSwatch key={row.name} name={row.name} />
      ))}
    </div>
  );
}

function ColorSwatch({ name }: { name: string }) {
  const cssVar = `--color-${name}`;
  return (
    <div className="space-y-2">
      <div
        className="h-24 w-full rounded-md border"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <div className="text-small font-medium">{cssVar}</div>
      </div>
    </div>
  );
}

function SpacingRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-56 text-mono text-small">{name}</div>
      <div className="h-3 w-3 bg-primary/15" />
      <div className="text-small text-muted-foreground">{value}</div>
    </div>
  );
}

function MotionDemo({ name, value }: { name: string; value: string }) {
  const [toggled, setToggled] = useState(false);
  return (
    <button
      onClick={() => setToggled((t) => !t)}
      className="flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left"
    >
      <div className="w-full">
        <div className="text-mono text-small">{name}</div>
        <div className="text-caption text-muted-foreground">{value}</div>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary"
          style={{
            width: toggled ? "100%" : "10%",
            transitionProperty: "width",
            transitionDuration: `var(${name})`,
            transitionTimingFunction: "var(--ease-out)"
          }}
        />
      </div>
      <div className="text-caption text-muted-foreground">Tap to animate</div>
    </button>
  );
}

function FontCard({
  label,
  role,
  cssFamily,
  sample,
  italicSample,
  note
}: {
  label: string;
  role: string;
  cssFamily: string;
  sample: string;
  italicSample?: string;
  note: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle>{label}</CardTitle>
          <code className="text-caption text-muted-foreground">{role}</code>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl" style={{ fontFamily: cssFamily }}>{sample}</div>
        {italicSample ? (
          <div className="text-2xl italic" style={{ fontFamily: cssFamily }}>{italicSample}</div>
        ) : null}
        <p className="text-small text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
