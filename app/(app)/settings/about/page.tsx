"use client";

// Settings → About. Version (env), build hash (env), build time (env),
// 7-tap easter egg on the version number to enable dev mode, legal links,
// and an open-source acknowledgements list.

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { SettingsSection } from "@/components/settings/SettingsSection";
import { enableDevMode, useDevMode } from "@/hooks/use-dev-mode";
import { settingsAbout } from "@/lib/copy";

const APP_VERSION =
  process.env.NEXT_PUBLIC_BUILD_VERSION
  ?? process.env.NEXT_PUBLIC_APP_VERSION
  ?? settingsAbout.unknownBuild;
const GIT_SHA =
  process.env.NEXT_PUBLIC_BUILD_HASH
  ?? process.env.NEXT_PUBLIC_GIT_SHA
  ?? null;
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? null;

function formatBuildTime(iso: string | null): string {
  if (!iso) return settingsAbout.unknownTime;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function VersionTapHandler({ children }: { children: React.ReactNode }) {
  const devMode = useDevMode();
  const [taps, setTaps] = React.useState(0);
  const lastTapRef = React.useRef(0);

  const onTap = () => {
    if (devMode) return;
    const now = Date.now();
    // Reset if more than 1.5s since last tap.
    const next = now - lastTapRef.current > 1_500 ? 1 : taps + 1;
    lastTapRef.current = now;
    setTaps(next);

    if (next >= 7) {
      enableDevMode();
      toast.success(settingsAbout.versionTapEnabled);
      setTaps(0);
      // Bounce to refresh useDevMode subscribers.
      window.setTimeout(() => window.location.reload(), 400);
    } else if (next >= 2 && next < 7) {
      toast.message(`${7 - next} more taps…`);
    }
  };

  return (
    <button
      type="button"
      onClick={onTap}
      className="cursor-default text-left font-mono text-sm text-foreground hover:text-primary"
    >
      {children}
    </button>
  );
}

export default function SettingsAboutPage() {
  return (
    <div>
      <SettingsSection
        title="Build"
        description="Where this version came from."
        flush
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-8">
          <dt className="font-medium text-muted-foreground">
            {settingsAbout.versionLabel}
          </dt>
          <dd>
            <VersionTapHandler>{APP_VERSION}</VersionTapHandler>
          </dd>

          <dt className="font-medium text-muted-foreground">
            {settingsAbout.buildLabel}
          </dt>
          <dd className="font-mono text-foreground">
            {GIT_SHA ? GIT_SHA.slice(0, 7) : settingsAbout.unknownBuild}
          </dd>

          <dt className="font-medium text-muted-foreground">
            {settingsAbout.buildTimeLabel}
          </dt>
          <dd className="font-mono text-foreground">
            {formatBuildTime(BUILD_TIME)}
          </dd>
        </dl>
      </SettingsSection>

      <SettingsSection title={settingsAbout.legalGroup}>
        <ul className="space-y-2 text-sm">
          {/* TODO(routes): replace with external clevroy.com URL when decided. */}
          <li>
            <Link
              href="/terms"
              className="text-foreground underline-offset-4 hover:underline focus-visible:underline"
            >
              {settingsAbout.links.terms}
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className="text-foreground underline-offset-4 hover:underline focus-visible:underline"
            >
              {settingsAbout.links.privacy}
            </Link>
          </li>
          <li>
            <Link
              href="/licenses"
              className="text-foreground underline-offset-4 hover:underline focus-visible:underline"
            >
              {settingsAbout.links.licenses}
            </Link>
          </li>
          <li>
            <Link
              href="/help"
              className="text-foreground underline-offset-4 hover:underline focus-visible:underline"
            >
              {settingsAbout.links.help}
            </Link>
          </li>
        </ul>
      </SettingsSection>

      <SettingsSection
        title={settingsAbout.acknowledgementsTitle}
        description={settingsAbout.acknowledgementsDescription}
      >
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-foreground sm:grid-cols-3">
          {settingsAbout.acknowledgements.map((dep) => (
            <li key={dep} className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {dep}
            </li>
          ))}
        </ul>
      </SettingsSection>

      <p className="border-t border-border pt-8 text-center font-serif text-sm italic text-muted-foreground">
        {settingsAbout.wordmarkCaption}
      </p>
    </div>
  );
}
