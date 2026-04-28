"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Local persistence for notification preferences. Layer 5 will replace the
 * autosave callback with a real PATCH /api/me { notification_preferences }
 * once the field shape is locked.
 */

export type EventKey = "filmReady" | "filmError" | "weeklyDigest";

export type ChannelToggle = { email: boolean; push: boolean };

export type NotificationsState = {
  events: Record<EventKey, ChannelToggle>;
  security: { newSignIn: { push: boolean } };
  marketing: boolean;

  setEventChannel: (
    event: EventKey,
    channel: "email" | "push",
    on: boolean,
  ) => void;
  setSecurityPush: (on: boolean) => void;
  setMarketing: (on: boolean) => void;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      events: {
        filmReady: { email: true, push: true },
        filmError: { email: true, push: false },
        weeklyDigest: { email: false, push: false },
      },
      security: { newSignIn: { push: false } },
      marketing: false,

      setEventChannel: (event, channel, on) =>
        set((state) => ({
          events: {
            ...state.events,
            [event]: { ...state.events[event], [channel]: on },
          },
        })),

      setSecurityPush: (on) =>
        set((state) => ({
          security: { ...state.security, newSignIn: { push: on } },
        })),

      setMarketing: (on) => set({ marketing: on }),
    }),
    {
      name: "clevroy:notifications:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
