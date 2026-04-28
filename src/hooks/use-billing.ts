// Stratum — billing hooks. Contract only (S0). Implementations land in S6.

import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type {
  ApiError,
  BuyFilmsRequest,
  BuyFilmsResponse,
  CreditsListResponse,
} from "@/types/api";

export const billingQueryKeys = {
  /** GET /api/me/credits — balance + paginated transaction list. */
  credits: () => ["billing", "credits"] as const,
} as const;

function stub(hook: string): never {
  throw new Error(
    `[Stratum stub] ${hook}() not implemented yet. Lands in S6.`,
  );
}

/** GET /api/me/credits — balance + transactions. Drives Settings → Billing
 * (Ghost's G7). Note: the `credits` surface word is allowed in this section
 * per Brand_Guide §5.3 (billing/invoice line items). */
export function useCredits(): UseQueryResult<CreditsListResponse, ApiError> {
  return stub("useCredits");
}

/** POST /api/me/credits/purchase — kicks off the Stripe redirect (mocked
 * during MVP beta). Successful purchase flows back through the Stripe
 * webhook → Realtime → balance store; the mutation response only carries
 * the redirect URL. */
export function useBuyFilms(): UseMutationResult<
  BuyFilmsResponse,
  ApiError,
  BuyFilmsRequest
> {
  return stub("useBuyFilms");
}
