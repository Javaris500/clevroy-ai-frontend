// Stratum — AI Twin hooks. Contract only (S0). Implementations land in S6.

import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type {
  ApiError,
  TwinTrainRequest,
  TwinTrainResponse,
  TwinUploadUrlRequest,
  TwinUploadUrlResponse,
  TwinsStatusResponse,
} from "@/types/api";

export const twinsQueryKeys = {
  status: () => ["twins", "status"] as const,
} as const;

function stub(hook: string): never {
  throw new Error(
    `[Stratum stub] ${hook}() not implemented yet. Lands in S6.`,
  );
}

/** GET /api/me/twins — voice + face status for Ghost's AI Twin page. */
export function useTwins(): UseQueryResult<TwinsStatusResponse, ApiError> {
  return stub("useTwins");
}

/** POST /api/me/twins/voice/upload-url — direct-to-R2 signed upload (the
 * route Ghost asked about in the 2026-04-24 coord entry; resolved as
 * direct-to-R2 per Backend_Handoff §8.7). */
export function useVoiceTwinUploadUrl(): UseMutationResult<
  TwinUploadUrlResponse,
  ApiError,
  TwinUploadUrlRequest
> {
  return stub("useVoiceTwinUploadUrl");
}

/** POST /api/me/twins/voice/train — kicks off training after samples land
 * in R2. Returns a Celery task_id; Ghost's UI polls via `useTwins()` for
 * status transitions (none → training → ready / failed) — EC-N10 covers the
 * failure UX. */
export function useStartVoiceTwin(): UseMutationResult<
  TwinTrainResponse,
  ApiError,
  TwinTrainRequest
> {
  return stub("useStartVoiceTwin");
}

/** POST /api/me/twins/face/upload-url — same shape as voice. */
export function useFaceTwinUploadUrl(): UseMutationResult<
  TwinUploadUrlResponse,
  ApiError,
  TwinUploadUrlRequest
> {
  return stub("useFaceTwinUploadUrl");
}

/** POST /api/me/twins/face/train. */
export function useStartFaceTwin(): UseMutationResult<
  TwinTrainResponse,
  ApiError,
  TwinTrainRequest
> {
  return stub("useStartFaceTwin");
}
