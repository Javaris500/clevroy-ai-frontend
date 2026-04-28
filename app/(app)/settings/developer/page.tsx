"use client";

// Settings → Developer. Hidden behind useDevMode() — visiting the route
// directly without `?dev=1` (or the About-page easter egg) renders a
// "page not available" placeholder. The Settings shell hides the tab
// trigger entirely when dev mode is off (see app/(app)/settings/layout.tsx).

import * as React from "react";
import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useDevMode } from "@/hooks/use-dev-mode";
import { useCreateOptionsStore } from "@/stores/create-options-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useUIStore } from "@/stores/ui-store";
import { settingsDeveloper } from "@/lib/copy";
import { cn } from "@/lib/utils";

const FIXTURE_OVERRIDE_KEY = "clevroy:fixture-override";
const ENV_FIXTURE_ON = process.env.NEXT_PUBLIC_USE_HARDCODED === "true";

function readFixtureOverride(): boolean | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(FIXTURE_OVERRIDE_KEY);
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function FixtureSection() {
  const [override, setOverride] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setOverride(readFixtureOverride());
  }, []);

  const resolved = override ?? ENV_FIXTURE_ON;
  const source =
    override === null
      ? settingsDeveloper.fixtureSection.sourceEnv
      : settingsDeveloper.fixtureSection.sourceOverride;

  const handleToggle = (next: boolean) => {
    if (next === ENV_FIXTURE_ON) {
      // Match env — clear the override so we fall back to env.
      window.localStorage.removeItem(FIXTURE_OVERRIDE_KEY);
      setOverride(null);
    } else {
      window.localStorage.setItem(FIXTURE_OVERRIDE_KEY, String(next));
      setOverride(next);
    }
    toast.success(
      next
        ? settingsDeveloper.fixtureSection.onLabel
        : settingsDeveloper.fixtureSection.offLabel,
    );
  };

  return (
    <SettingsSection
      title={settingsDeveloper.fixtureSection.title}
      description={settingsDeveloper.fixtureSection.description}
      flush
    >
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {resolved
              ? settingsDeveloper.fixtureSection.onLabel
              : settingsDeveloper.fixtureSection.offLabel}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {source}
          </p>
        </div>
        <Switch
          checked={resolved}
          onCheckedChange={handleToggle}
          aria-label="Fixture mode"
        />
      </div>
    </SettingsSection>
  );
}

function FlagsSection() {
  return (
    <SettingsSection
      title={settingsDeveloper.flagsSection.title}
      description={settingsDeveloper.flagsSection.description}
    >
      <p className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        {settingsDeveloper.flagsSection.empty}
      </p>
    </SettingsSection>
  );
}

function ResetSection() {
  const [open, setOpen] = React.useState(false);

  const performReset = () => {
    if (typeof window === "undefined") return;
    const ls = window.localStorage;
    const ss = window.sessionStorage;
    const lsKeys = Object.keys(ls).filter((k) => k.startsWith("clevroy"));
    for (const k of lsKeys) ls.removeItem(k);
    const ssKeys = Object.keys(ss).filter((k) => k.startsWith("clevroy"));
    for (const k of ssKeys) ss.removeItem(k);
    setOpen(false);
    toast.success(settingsDeveloper.resetSection.success);
    // Force a reload so persisted-store hydration restarts from defaults.
    window.setTimeout(() => window.location.reload(), 350);
  };

  return (
    <SettingsSection
      title={settingsDeveloper.resetSection.title}
      description={settingsDeveloper.resetSection.description}
    >
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        {settingsDeveloper.resetSection.cta}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {settingsDeveloper.resetSection.confirm.title}
            </DialogTitle>
            <DialogDescription>
              {settingsDeveloper.resetSection.confirm.body}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
            >
              {settingsDeveloper.resetSection.confirm.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={performReset}
            >
              {settingsDeveloper.resetSection.confirm.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}

function PreferencesJsonSection() {
  const ui = useUIStore();
  const create = useCreateOptionsStore();
  const notifs = useNotificationsStore();

  const snapshot = React.useMemo(
    () =>
      JSON.stringify(
        {
          ui: {
            theme: ui.theme,
            sidebarCollapsed: ui.sidebarCollapsed,
            reducedMotionOverride: ui.reducedMotionOverride,
          },
          createOptions: { aspect: create.aspect, style: create.style },
          notifications: {
            events: notifs.events,
            security: notifs.security,
            marketing: notifs.marketing,
          },
          fixtureOverride: readFixtureOverride(),
          envFixtureOn: ENV_FIXTURE_ON,
        },
        null,
        2,
      ),
    [
      ui.theme,
      ui.sidebarCollapsed,
      ui.reducedMotionOverride,
      create.aspect,
      create.style,
      notifs.events,
      notifs.security,
      notifs.marketing,
    ],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snapshot);
      toast.success(settingsDeveloper.preferencesSection.copied);
    } catch {
      toast.error("Couldn't copy. Try selecting the text manually.");
    }
  };

  return (
    <SettingsSection
      title={settingsDeveloper.preferencesSection.title}
      description={settingsDeveloper.preferencesSection.description}
      headerAction={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleCopy}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          {settingsDeveloper.preferencesSection.copyCta}
        </Button>
      }
    >
      <pre
        className={cn(
          "max-h-96 overflow-auto rounded-xl border border-border bg-muted/30 p-4",
          "font-mono text-xs leading-relaxed text-foreground",
        )}
      >
        {snapshot}
      </pre>
    </SettingsSection>
  );
}

export default function SettingsDeveloperPage() {
  const enabled = useDevMode();

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <p className="text-base font-medium text-foreground">
          {settingsDeveloper.notAvailableTitle}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {settingsDeveloper.notAvailableBody}
        </p>
      </div>
    );
  }

  return (
    <div>
      <FixtureSection />
      <FlagsSection />
      <ResetSection />
      <PreferencesJsonSection />
    </div>
  );
}
