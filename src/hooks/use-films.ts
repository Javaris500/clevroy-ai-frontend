// Stratum — film + user TanStack Query hooks (S6 implementation).
//
// Until the real Supabase + REST client (S5) lands, every hook resolves
// against the fixtures in `_fixtures.ts`. The shapes here match the contract
// other agents (Leon, Fantem, Kaiser, Nemi, Ghost) build against, so swapping
// fixture branches for real fetches in S5/S6.next is a one-file change.
//
// Why this path: Leon's home + projects pages already import from
// `@/hooks/use-films`. Don't move it without coordination.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  FIXTURE_FILMS,
  FIXTURE_IN_PROGRESS_FILM,
  FIXTURE_PROFILE,
  fixtureCancelFilmResponse,
  fixtureCreateFilmResponse,
  fixtureDeleteResponse,
  fixtureDuplicateResponse,
  fixtureFilmDetail,
  fixtureFilmStateSnapshot,
  fixtureFilmsPage,
  fixtureReshootResponse,
} from "@/hooks/_fixtures";
import type {
  ApiError,
  CancelFilmRequest,
  CancelFilmResponse,
  CreateFilmRequest,
  CreateFilmResponse,
  DeleteFilmResponse,
  DuplicateFilmResponse,
  Film,
  FilmsListResponse,
  FilmsSort,
  FilmStateSnapshot,
  FilmSummary,
  Profile,
  RenameFilmRequest,
  ReshootSceneRequest,
  ReshootSceneResponse,
} from "@/types/api";

// ---------------------------------------------------------------------------
// Query keys — stable across the codebase. Imported by the API client and
// any test harness. Other agents can also import these to invalidate
// selectively (e.g., after a mutation in their own UI).
// ---------------------------------------------------------------------------

export const filmsQueryKeys = {
  all: () => ["films"] as const,
  user: () => ["user"] as const,
  list: (params: { search?: string; sort?: FilmsSort } = {}) =>
    ["films", "list", params] as const,
  recent: (limit: number) => ["films", "recent", { limit }] as const,
  inProgress: () => ["films", "in-progress"] as const,
  detail: (id: string) => ["films", "detail", id] as const,
  state: (id: string) => ["films", "state", id] as const,
} as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useUser(): UseQueryResult<Profile, ApiError> {
  return useQuery<Profile, ApiError>({
    queryKey: filmsQueryKeys.user(),
    queryFn: async () => FIXTURE_PROFILE,
  });
}

export function useRecentFilms(
  limit: number = 8,
): UseQueryResult<FilmSummary[], ApiError> {
  return useQuery<FilmSummary[], ApiError>({
    queryKey: filmsQueryKeys.recent(limit),
    queryFn: async () =>
      FIXTURE_FILMS.filter((f) => !["error", "canceled"].includes(f.state) ||
        f.state === "canceled")
        .slice(0, limit),
  });
}

export function useInProgressFilm(): UseQueryResult<
  FilmSummary | null,
  ApiError
> {
  return useQuery<FilmSummary | null, ApiError>({
    queryKey: filmsQueryKeys.inProgress(),
    queryFn: async () => FIXTURE_IN_PROGRESS_FILM,
  });
}

export function useInfiniteFilms(
  params: { search?: string; sort?: FilmsSort } = {},
): UseInfiniteQueryResult<InfiniteData<FilmsListResponse, string | null>, ApiError> {
  return useInfiniteQuery<
    FilmsListResponse,
    ApiError,
    InfiniteData<FilmsListResponse, string | null>,
    ReturnType<typeof filmsQueryKeys.list>,
    string | null
  >({
    queryKey: filmsQueryKeys.list(params),
    initialPageParam: null,
    queryFn: async ({ pageParam }) =>
      fixtureFilmsPage({
        cursor: pageParam,
        search: params.search,
        sort: params.sort,
      }),
    getNextPageParam: (last) => last.next_cursor,
  });
}

export function useFilm(
  filmId: string | undefined,
): UseQueryResult<Film, ApiError> {
  return useQuery<Film, ApiError>({
    queryKey: filmsQueryKeys.detail(filmId ?? "missing"),
    enabled: Boolean(filmId),
    queryFn: async () => fixtureFilmDetail(filmId!),
  });
}

export function useFilmState(
  filmId: string | undefined,
): UseQueryResult<FilmStateSnapshot, ApiError> {
  return useQuery<FilmStateSnapshot, ApiError>({
    queryKey: filmsQueryKeys.state(filmId ?? "missing"),
    enabled: Boolean(filmId),
    queryFn: async () => fixtureFilmStateSnapshot(filmId!),
  });
}

// ---------------------------------------------------------------------------
// Mutations — fixture branches resolve immediately and invalidate the
// relevant query keys so the UI re-renders. Real network errors will surface
// here once S5's API client is wired.
// ---------------------------------------------------------------------------

export function useCreateFilm(): UseMutationResult<
  CreateFilmResponse,
  ApiError,
  CreateFilmRequest
> {
  const qc = useQueryClient();
  return useMutation<CreateFilmResponse, ApiError, CreateFilmRequest>({
    mutationFn: async () => fixtureCreateFilmResponse(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: filmsQueryKeys.all() });
      qc.invalidateQueries({ queryKey: filmsQueryKeys.user() });
    },
  });
}

export function useCancelFilm(): UseMutationResult<
  CancelFilmResponse,
  ApiError,
  { id: string } & CancelFilmRequest
> {
  const qc = useQueryClient();
  return useMutation<
    CancelFilmResponse,
    ApiError,
    { id: string } & CancelFilmRequest
  >({
    mutationFn: async () => fixtureCancelFilmResponse(),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: filmsQueryKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: filmsQueryKeys.inProgress() });
      qc.invalidateQueries({ queryKey: filmsQueryKeys.user() });
    },
  });
}

export function useReshootScene(): UseMutationResult<
  ReshootSceneResponse,
  ApiError,
  { filmId: string; sceneId: string } & ReshootSceneRequest
> {
  const qc = useQueryClient();
  return useMutation<
    ReshootSceneResponse,
    ApiError,
    { filmId: string; sceneId: string } & ReshootSceneRequest
  >({
    mutationFn: async (vars) => fixtureReshootResponse(vars.reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: filmsQueryKeys.detail(vars.filmId) });
      qc.invalidateQueries({ queryKey: filmsQueryKeys.user() });
    },
  });
}

export function useDeleteFilm(): UseMutationResult<
  DeleteFilmResponse,
  ApiError,
  { id: string }
> {
  const qc = useQueryClient();
  return useMutation<DeleteFilmResponse, ApiError, { id: string }>({
    mutationFn: async () => fixtureDeleteResponse(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: filmsQueryKeys.all() });
    },
  });
}

export function useRenameFilm(): UseMutationResult<
  Film,
  ApiError,
  { id: string } & Partial<RenameFilmRequest>
> {
  const qc = useQueryClient();
  return useMutation<
    Film,
    ApiError,
    { id: string } & Partial<RenameFilmRequest>
  >({
    mutationFn: async (vars) => {
      const base = fixtureFilmDetail(vars.id);
      return vars.title ? { ...base, title: vars.title } : base;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: filmsQueryKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: filmsQueryKeys.all() });
    },
  });
}

export function useDuplicateFilm(): UseMutationResult<
  DuplicateFilmResponse,
  ApiError,
  { id: string }
> {
  const qc = useQueryClient();
  return useMutation<DuplicateFilmResponse, ApiError, { id: string }>({
    mutationFn: async () => fixtureDuplicateResponse(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: filmsQueryKeys.all() });
      qc.invalidateQueries({ queryKey: filmsQueryKeys.user() });
    },
  });
}

export function useRestoreFilm(): UseMutationResult<
  Film,
  ApiError,
  { id: string }
> {
  const qc = useQueryClient();
  return useMutation<Film, ApiError, { id: string }>({
    mutationFn: async (vars) => fixtureFilmDetail(vars.id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: filmsQueryKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: filmsQueryKeys.all() });
    },
  });
}
