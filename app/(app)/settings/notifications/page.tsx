"use client";

// Settings → Notifications. Channel grid (email + push) for film events,
// account security row (email always on), marketing card, all autosaved.

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { SettingsSection } from "@/components/settings/SettingsSection";
import { Switch } from "@/components/ui/switch";
import { useLastSavedStore } from "@/stores/last-saved-store";
import {
  useNotificationsStore,
  type EventKey,
} from "@/stores/notifications-store";
import { settingsNotifications } from "@/lib/copy";
import { cn } from "@/lib/utils";

const EVENTS: ReadonlyArray<EventKey> = [
  "filmReady",
  "filmError",
  "weeklyDigest",
];

// ---------------------------------------------------------------------------
// Push permission helper
// ---------------------------------------------------------------------------

type PushState = "unsupported" | "default" | "granted" | "denied";

function readPushState(): PushState {
  if (typeof window === "undefined") return "default";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PushState;
}

async function requestPushPermission(): Promise<PushState> {
  if (typeof window === "undefined") return "default";
  if (!("Notification" in window)) return "unsupported";
  const result = await Notification.requestPermission();
  return result as PushState;
}

// ---------------------------------------------------------------------------
// ChannelGrid
// ---------------------------------------------------------------------------

function ChannelGrid({
  pushState,
  onPushPromptNeeded,
}: {
  pushState: PushState;
  onPushPromptNeeded: () => Promise<PushState>;
}) {
  const events = useNotificationsStore((s) => s.events);
  const setChannel = useNotificationsStore((s) => s.setEventChannel);
  const markSaved = useLastSavedStore((s) => s.markSaved);

  const updateChannel = async (
    key: EventKey,
    channel: "email" | "push",
    on: boolean,
  ) => {
    if (channel === "push" && on && pushState !== "granted") {
      const next = await onPushPromptNeeded();
      if (next !== "granted") return;
    }
    setChannel(key, channel, on);
    markSaved();
    toast.success(
      settingsNotifications.savedToast(
        settingsNotifications.events[key].label,
      ),
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-2 bg-muted/40 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span>{settingsNotifications.channelHeader.event}</span>
        <span className="text-center">
          {settingsNotifications.channelHeader.email}
        </span>
        <span className="text-center">
          {settingsNotifications.channelHeader.push}
        </span>
      </div>
      <ul>
        {EVENTS.map((key) => {
          const event = settingsNotifications.events[key];
          const value = events[key];
          return (
            <li
              key={key}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-2 border-t border-border px-4 py-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {event.label}
                </p>
                <p className="text-xs text-muted-foreground">{event.caption}</p>
              </div>
              <Switch
                checked={value.email}
                onCheckedChange={(on) => updateChannel(key, "email", on)}
                aria-label={settingsNotifications.toggleAria(
                  event.label,
                  "Email",
                  value.email,
                )}
              />
              <Switch
                checked={value.push}
                onCheckedChange={(on) => updateChannel(key, "push", on)}
                disabled={pushState === "unsupported"}
                aria-label={settingsNotifications.toggleAria(
                  event.label,
                  "Push",
                  value.push,
                )}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsNotificationsPage() {
  const [pushState, setPushState] = React.useState<PushState>("default");
  React.useEffect(() => {
    setPushState(readPushState());
  }, []);

  const security = useNotificationsStore((s) => s.security);
  const setSecurityPush = useNotificationsStore((s) => s.setSecurityPush);
  const marketing = useNotificationsStore((s) => s.marketing);
  const setMarketing = useNotificationsStore((s) => s.setMarketing);
  const markSaved = useLastSavedStore((s) => s.markSaved);

  const handlePushPrompt = async (): Promise<PushState> => {
    const next = await requestPushPermission();
    setPushState(next);
    return next;
  };

  const handleSecurityPush = async (on: boolean) => {
    if (on && pushState !== "granted") {
      const next = await handlePushPrompt();
      if (next !== "granted") return;
    }
    setSecurityPush(on);
    markSaved();
    toast.success(
      settingsNotifications.savedToast(
        settingsNotifications.security.newSignIn.label,
      ),
    );
  };

  const handleMarketing = (on: boolean) => {
    setMarketing(on);
    markSaved();
    toast.success(
      settingsNotifications.savedToast(
        settingsNotifications.marketing.productNews.label,
      ),
    );
  };

  return (
    <div>
      <SettingsSection
        title={settingsNotifications.filmEventsTitle}
        description={settingsNotifications.filmEventsDescription}
        flush
      >
        <ChannelGrid
          pushState={pushState}
          onPushPromptNeeded={handlePushPrompt}
        />
        {pushState === "denied" ? (
          <p className="text-xs text-muted-foreground">
            {settingsNotifications.pushDenied}{" "}
            <a
              href="https://support.google.com/chrome/answer/3220216"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              {settingsNotifications.pushDeniedHelp}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </p>
        ) : pushState === "unsupported" ? (
          <p className="text-xs text-muted-foreground">
            {settingsNotifications.pushNotSupported}
          </p>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title={settingsNotifications.securityTitle}
        description={settingsNotifications.securityDescription}
      >
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-2 rounded-2xl border border-border px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {settingsNotifications.security.newSignIn.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {settingsNotifications.security.newSignIn.caption}
            </p>
          </div>
          <Switch
            checked
            disabled
            aria-label="Email always on for security"
          />
          <Switch
            checked={security.newSignIn.push}
            onCheckedChange={handleSecurityPush}
            disabled={pushState === "unsupported"}
            aria-label="Push for new device sign-in"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title={settingsNotifications.marketingTitle}
        description={settingsNotifications.marketingDescription}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm",
          )}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {settingsNotifications.marketing.productNews.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {settingsNotifications.marketing.productNews.caption}
            </p>
          </div>
          <Switch
            checked={marketing}
            onCheckedChange={handleMarketing}
            aria-label="Product news email"
          />
        </div>
      </SettingsSection>
    </div>
  );
}
