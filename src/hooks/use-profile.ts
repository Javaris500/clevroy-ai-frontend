import { useProfileContext } from "@/components/providers/profile-provider";
import type { Profile } from "@/types/api";

/**
 * Reads the current user profile from the single ProfileProvider mounted in
 * `app/(app)/layout.tsx`. Three sidebar surfaces (FilmBalanceBadge, ProfileChip,
 * and InProgressIndicator's sign-out gate) used to subscribe to `useUser()`
 * independently — TanStack dedupes the request, but each component re-rendered
 * on its own loading transition and each carried its own NEXT_PUBLIC_USE_HARDCODED
 * fixture branch (with an eslint-disable for the conditional hook). The provider
 * collapses both into one place.
 *
 * Throws if used outside `<ProfileProvider />`.
 */
export function useProfile(): { profile: Profile | null; isLoading: boolean } {
  return useProfileContext();
}
