"use client";

import * as React from "react";

import { useUser } from "@/hooks/use-films";
import type { Profile } from "@/types/api";

const USE_HARDCODED = process.env.NEXT_PUBLIC_USE_HARDCODED === "true";

const FIXTURE_PROFILE: Profile = {
  id: "fixture-user-001",
  display_name: "Javaris",
  first_name: "Javaris",
  avatar_url: null,
  films_remaining: "3.00",
  theme_preference: "system",
  reduced_motion: false,
  voice_twin_status: "none",
  voice_twin_key: null,
  face_twin_status: "none",
  face_twin_key: null,
  onboarding_completed_at: "2026-04-20T12:00:00Z",
};

type ProfileContextValue = {
  profile: Profile | null;
  isLoading: boolean;
};

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

function FixtureProfileProvider({ children }: { children: React.ReactNode }) {
  const value = React.useMemo<ProfileContextValue>(
    () => ({ profile: FIXTURE_PROFILE, isLoading: false }),
    [],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

function LiveProfileProvider({ children }: { children: React.ReactNode }) {
  const q = useUser();
  const value = React.useMemo<ProfileContextValue>(
    () => ({ profile: q.data ?? null, isLoading: q.isLoading }),
    [q.data, q.isLoading],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const Inner = USE_HARDCODED ? FixtureProfileProvider : LiveProfileProvider;
  return <Inner>{children}</Inner>;
}

export function useProfileContext(): ProfileContextValue {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) {
    throw new Error(
      "useProfile() must be used inside <ProfileProvider />. Mount it in app/(app)/layout.tsx.",
    );
  }
  return ctx;
}
