"use client";

// Client-side orchestrator for /create. Owns:
//   - the input vs generation phase swap (same route, different UI per
//     Design_System §7.4)
//   - script + style preset state (preserved across cancel — EC-G6)
//   - sessionStorage draft autosave every ~2s (EC-N5)
//   - the create / cancel mutation calls (gated on the hardcoded fixtures
//     flag while Stratum's hooks are stubs)
//   - the films-balance read for the EC-N2 zero-films CTA swap
//
// Imports Nemi's three components via Fantem's <CreateGenerationPhase />
// wrapper, which drops in <CenterStage /> alongside.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useHardcodedFixtures } from "@/hooks/_fixtures";
import {
  globalToasts,
  navLinks,
  stylePresets,
  type StylePresetId,
} from "@/lib/copy";
import type { Profile } from "@/types/api";

import CreateGenerationPhase from "./CreateGenerationPhase";
import CreateInputPhase from "./CreateInputPhase";
import { useGenerationStream } from "./use-generation-stream";
import { FIXTURE_FILM_ID } from "./generation-fixtures";

type Phase = "input" | "generation";

const SESSION_DRAFT_KEY = "clevroy_create_draft_v1";
const SESSION_RETURN_KEY = "clevroy_return_to";
const AUTOSAVE_INTERVAL_MS = 2000;

type PersistedDraft = {
  scriptText: string;
  styleId: StylePresetId | null;
};

export type CreateClientProps = {
  /** Optional — once Stratum's `useUser()` lands the parent can pass the
   * resolved profile in to drive the films-left UI without each child
   * page re-fetching it. Optional today. */
  initialProfile?: Profile | null;
};

export function CreateClient({ initialProfile = null }: CreateClientProps) {
  const router = useRouter();
  const hardcoded = useHardcodedFixtures();

  // -------------------------------------------------------------------
  // Phase + script state. Preserved across cancel per EC-G6.
  // -------------------------------------------------------------------
  const [phase, setPhase] = useState<Phase>("input");
  const [scriptText, setScriptText] = useState("");
  const [styleId, setStyleId] = useState<StylePresetId | null>(null);
  const [filmId, setFilmId] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Hydrate the draft from sessionStorage on mount (EC-N5 path).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(SESSION_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedDraft;
      if (typeof parsed.scriptText === "string" && parsed.scriptText.length > 0) {
        setScriptText(parsed.scriptText);
        setStyleId(parsed.styleId ?? null);
        setDraftRestored(true);
      }
    } catch {
      // Corrupt draft — discard silently. The user simply gets a fresh page.
    }
  }, []);

  // Clear the "draft restored" notice after a few seconds.
  useEffect(() => {
    if (!draftRestored) return;
    const t = setTimeout(() => setDraftRestored(false), 4000);
    return () => clearTimeout(t);
  }, [draftRestored]);

  // Autosave every 2s while the input phase is open. Stop saving once the
  // user starts generation; on cancel we restore from the in-memory state
  // (no re-read from sessionStorage required during the same session).
  const lastSavedRef = useRef<string>("");
  useEffect(() => {
    if (phase !== "input") return;
    if (typeof window === "undefined") return;
    const interval = setInterval(() => {
      const next: PersistedDraft = { scriptText, styleId };
      const serialized = JSON.stringify(next);
      if (serialized === lastSavedRef.current) return;
      lastSavedRef.current = serialized;
      try {
        window.sessionStorage.setItem(SESSION_DRAFT_KEY, serialized);
      } catch {
        // Quota / private mode — ignore.
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase, scriptText, styleId]);

  // EC-N5 — when the session-expiration modal redirects the user back to
  // /create, the middleware writes their pre-expiry URL to sessionStorage.
  // Clear it on successful mount so we don't re-redirect later.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SESSION_RETURN_KEY);
  }, []);

  // -------------------------------------------------------------------
  // Films balance — used to drive the EC-N2 CTA swap. In real mode this
  // comes from Stratum's `useUser()` (S6) → balance store (S8). Until then
  // we fixture a small balance so the happy path renders.
  // -------------------------------------------------------------------
  // Whole-films integer for EC-N2 gating. The original NUMERIC(8,2) string
  // is preserved and forwarded to <CostPreviewChip /> so that surface never
  // sees a float (Layout_Enhancements A.10 / Frontend_Bootstrap §1).
  const filmsRemainingString = initialProfile?.films_remaining
    ?? (hardcoded ? "3.00" : undefined);
  const filmsLeft = useMemo<number>(() => {
    if (filmsRemainingString) {
      const parsed = Number.parseFloat(filmsRemainingString);
      return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
    }
    return 0;
  }, [filmsRemainingString]);

  // -------------------------------------------------------------------
  // Generation stream (drives the generation phase view).
  // -------------------------------------------------------------------
  const styleLabel = useMemo(() => {
    if (!styleId) return null;
    return stylePresets.find((p) => p.id === styleId)?.label ?? null;
  }, [styleId]);

  const stream = useGenerationStream({
    filmId: phase === "generation" ? filmId ?? undefined : undefined,
    scriptText,
    styleLabel,
  });

  // -------------------------------------------------------------------
  // Mutations — gated on the hardcoded flag while Stratum's hooks throw.
  // -------------------------------------------------------------------
  const handleStart = useCallback(async () => {
    if (createPending) return;
    setCreatePending(true);
    try {
      if (hardcoded) {
        // Fixture path: jump straight to generation with the fixture id.
        await new Promise((res) => setTimeout(res, 250));
        setFilmId(FIXTURE_FILM_ID);
        setPhase("generation");
        return;
      }
      // Real path placeholder. Once Stratum's S6 ships, swap this for:
      //   const { mutateAsync } = useCreateFilm();
      //   const { film_id } = await mutateAsync({ ... });
      //   setFilmId(film_id);
      //   setPhase("generation");
      // Today the hook throws, so we fall back to fixture behavior with a
      // toast that surfaces the gap to the developer.
      toast.error("Backend hooks aren't live yet. Set NEXT_PUBLIC_USE_HARDCODED=true.");
    } finally {
      setCreatePending(false);
    }
  }, [createPending, hardcoded]);

  const handleBuyMoreFilms = useCallback(() => {
    // Iyo / Ghost own the purchase flow; route into Settings → Billing.
    router.push(`${navLinks.settings.href}/billing`);
  }, [router]);

  const handleCancelConfirmed = useCallback(async () => {
    if (cancelPending) return;
    setCancelPending(true);
    try {
      // ≤5s "Stopping…" interstitial per EC-G6.
      await new Promise((res) => setTimeout(res, 700));
      // Refund math is the backend's job. In hardcoded mode we surface a
      // representative refund. Real mode reads `refund_amount` from the
      // mutation response.
      const refunded = hardcoded ? "0.7" : "0.0";
      toast(globalToasts.filmRefunded(refunded).title, {
        description: globalToasts.filmRefunded(refunded).body,
      });
      setFilmId(null);
      setPhase("input");
    } finally {
      setCancelPending(false);
    }
  }, [cancelPending, hardcoded]);

  // EC-G4 — free reshoot (generation_failure). Once Stratum's mutation lands
  // we'll send `reason: 'generation_failure'`. For now: surface the intent
  // via toast and bounce back to scene_images_pending.
  const handleReshoot = useCallback(() => {
    toast("Reshooting that scene.", {
      description: "No film charged for the reshoot.",
    });
  }, []);

  const handleContinueWithout = useCallback(() => {
    toast("We'll assemble what finished.", {
      description: "The missed scene becomes a 1-second black intertitle.",
    });
  }, []);

  if (phase === "input") {
    return (
      <CreateInputPhase
        scriptText={scriptText}
        onScriptChange={setScriptText}
        styleId={styleId}
        onStyleChange={setStyleId}
        filmsLeft={filmsLeft}
        filmsRemainingString={filmsRemainingString}
        pending={createPending}
        draftRestored={draftRestored}
        onStart={handleStart}
        onBuyMoreFilms={handleBuyMoreFilms}
      />
    );
  }

  return (
    <CreateGenerationPhase
      filmId={filmId}
      stream={stream}
      cancelPending={cancelPending}
      onCancelConfirmed={handleCancelConfirmed}
      onReshoot={handleReshoot}
      onContinueWithout={handleContinueWithout}
    />
  );
}

export default CreateClient;
