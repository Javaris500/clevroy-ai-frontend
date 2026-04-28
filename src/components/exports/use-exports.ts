// Kaiser-local export hooks. Backend_Handoff §8.5 documents the routes:
//
//   POST /api/films/{id}/export/mp4         → 200 { url, expires_at }       (sync)
//   POST /api/films/{id}/export/book-pdf    → 202 { task_id }               (async)
//   POST /api/films/{id}/export/website-zip → 202 { task_id }               (async)
//   GET  /api/exports/{task_id}             → 200 { status, url, expires_at }
//
// Stratum's `src/hooks/use-films.ts` does not yet expose hooks for these
// routes (see coordination.md → Kaiser request). Until Stratum ships them,
// these Kaiser-local stubs let the Take-It-Home menu compile and behave
// against the typed contract from `src/types/api.ts`. Both modes are
// supported here:
//
//   - NEXT_PUBLIC_USE_HARDCODED=true → return mocked successful responses
//     with a synthetic delay so the UI's polling / pending behavior is
//     exercisable end-to-end without a backend.
//   - NEXT_PUBLIC_USE_HARDCODED=false → throw a clear migration error
//     pointing at the Stratum coordination request.
//
// When Stratum ships official hooks, replace imports of these wrappers with
// imports from `@/hooks/use-films` (or wherever Stratum lands them) and
// delete this file.

"use client";

import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { useHardcodedFixtures } from "@/hooks/_fixtures";
import type {
  ApiError,
  ExportFormat,
  ExportStatusResponse,
  ExportTaskResponse,
  SignedDownloadResponse,
} from "@/types/api";

const STUB_HINT =
  "Kaiser-local export hook. Real implementation pending Stratum (see coordination.md → Kaiser).";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cached playback URL for the hero player. Fetched on mount on the Results
 * page. Same backend route as `useRequestMp4Export` but exposed as a query so
 * navigating back to a Results page reuses the cached signed URL until it
 * expires. The hook re-fetches on a 50-minute interval (URLs are valid 1h).
 */
export function useFilmPlaybackUrl(
  filmId: string | undefined,
  options: { enabled?: boolean } = {},
): UseQueryResult<SignedDownloadResponse, ApiError> {
  const useHardcoded = useHardcodedFixtures();
  return useQuery<SignedDownloadResponse, ApiError>({
    queryKey: ["exports", "playback", filmId],
    enabled: filmId !== undefined && (options.enabled ?? true),
    staleTime: 50 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!useHardcoded) {
        throw new Error(`[Kaiser stub] useFilmPlaybackUrl — ${STUB_HINT}`);
      }
      await delay(200);
      return {
        url: `https://r2.example/clevroy/${filmId}/final.mp4?sig=fixture-playback`,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    },
  });
}

/** POST /api/films/{id}/export/mp4 — sync, returns a signed URL (1h validity). */
export function useRequestMp4Export(
  filmId: string,
): UseMutationResult<SignedDownloadResponse, ApiError, void> {
  const useHardcoded = useHardcodedFixtures();
  return useMutation<SignedDownloadResponse, ApiError, void>({
    mutationKey: ["exports", "mp4", filmId],
    mutationFn: async () => {
      if (!useHardcoded) {
        throw new Error(`[Kaiser stub] useRequestMp4Export — ${STUB_HINT}`);
      }
      await delay(400);
      return {
        url: `https://r2.example/clevroy/${filmId}/final.mp4?sig=fixture`,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    },
  });
}

/** POST /api/films/{id}/export/book-pdf — async, returns a task_id. */
export function useStartPdfExport(
  filmId: string,
): UseMutationResult<ExportTaskResponse, ApiError, void> {
  const useHardcoded = useHardcodedFixtures();
  return useMutation<ExportTaskResponse, ApiError, void>({
    mutationKey: ["exports", "pdf", filmId],
    mutationFn: async () => {
      if (!useHardcoded) {
        throw new Error(`[Kaiser stub] useStartPdfExport — ${STUB_HINT}`);
      }
      await delay(400);
      return { task_id: `mock-pdf-task-${filmId}` };
    },
  });
}

/** POST /api/films/{id}/export/website-zip — async, returns a task_id. */
export function useStartZipExport(
  filmId: string,
): UseMutationResult<ExportTaskResponse, ApiError, void> {
  const useHardcoded = useHardcodedFixtures();
  return useMutation<ExportTaskResponse, ApiError, void>({
    mutationKey: ["exports", "zip", filmId],
    mutationFn: async () => {
      if (!useHardcoded) {
        throw new Error(`[Kaiser stub] useStartZipExport — ${STUB_HINT}`);
      }
      await delay(400);
      return { task_id: `mock-zip-task-${filmId}` };
    },
  });
}

/** GET /api/exports/{task_id} — poll until status is "ready" or "failed".
 *  Refetches every 1500ms while pending/processing; stops on terminal status. */
export function useExportTaskStatus(
  taskId: string | null,
): UseQueryResult<ExportStatusResponse, ApiError> {
  const useHardcoded = useHardcodedFixtures();
  return useQuery<ExportStatusResponse, ApiError>({
    queryKey: ["exports", "status", taskId],
    enabled: taskId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1500;
      if (data.status === "ready" || data.status === "failed") return false;
      return 1500;
    },
    queryFn: async () => {
      if (!taskId) {
        throw new Error("[Kaiser stub] taskId required");
      }
      if (!useHardcoded) {
        throw new Error(`[Kaiser stub] useExportTaskStatus — ${STUB_HINT}`);
      }
      await delay(700);
      // Mock progression: pending → processing → ready over ~3s of polling.
      const stamp = Date.now() % 9000;
      if (stamp < 3000) {
        return { status: "pending", url: null, expires_at: null };
      }
      if (stamp < 6000) {
        return { status: "processing", url: null, expires_at: null };
      }
      return {
        status: "ready",
        url: `https://r2.example/clevroy/exports/${taskId}.bin?sig=fixture`,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    },
  });
}

export type ExportFormatOption = ExportFormat;
