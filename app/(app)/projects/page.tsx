"use client";

// /projects — Design_System §7.3 + Settings_Projects_Brief Section A.
//
// A memory shelf for the user's films. Composition-only — every data path
// flows through Stratum's hook contract (`use-films.ts`) when not running
// against fixtures.
//
// Hardcoded-fixtures toggle:
//   NEXT_PUBLIC_USE_HARDCODED=true  → inline fixtures (filterable + paginated).
//   unset / =false                  → useInfiniteFilms.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  FilmCard,
  FilmCardGrid,
  FilmCardSkeleton,
  PinnedShelf,
  useSeenFilms,
  useStillLoading,
} from "@/components/film-card";
import { NoFilmsEmptyState } from "@/components/empty-states";
import {
  globalToasts,
  projects,
  stillLoading as stillLoadingCopy,
} from "@/lib/copy";
import {
  useInfiniteFilms,
  useInProgressFilm,
  useDeleteFilm,
  useRenameFilm,
  useDuplicateFilm,
} from "@/hooks/use-films";
import { useHardcodedFixtures } from "@/hooks/_fixtures";
import {
  groupFilmsByRecency,
  RECENCY_GROUP_THRESHOLD,
} from "@/lib/film-grouping";
import {
  matchesStatusFilter,
  type FilmSummary,
  type FilmsSort,
  type FilmsStatusFilter,
} from "@/types/film";

const SEARCH_DEBOUNCE_MS = 350;
const FIXTURE_PAGE_SIZE = 8;
const UNDO_TIMEOUT_MS = 5_000;

const SORT_LABELS: Record<FilmsSort, string> = {
  created_desc: projects.sort.createdDesc,
  created_asc: projects.sort.createdAsc,
  title_asc: projects.sort.titleAsc,
};

const STATUS_FILTERS: ReadonlyArray<{
  value: FilmsStatusFilter;
  label: string;
}> = [
  { value: "all", label: projects.filter.all },
  { value: "in_progress", label: projects.filter.inProgress },
  { value: "complete", label: projects.filter.complete },
  { value: "error", label: projects.filter.error },
];

export default function ProjectsPage() {
  return useHardcodedFixtures() ? <ProjectsFixtures /> : <ProjectsWithHooks />;
}

// ---------------------------------------------------------------------------
// Fixture sub-component — INLINE sample list, plus a tiny client-side pager
// that mirrors useInfiniteQuery's `{ pages: FilmsListResponse[] }` shape so
// the view is identical on both branches.
// ---------------------------------------------------------------------------

const FIXTURE_FILMS: FilmSummary[] = [
  {
    id: "fixture-film-001",
    title: "The Last Reel",
    state: "complete",
    created_at: "2026-04-22T18:14:00Z",
    completed_at: "2026-04-22T18:21:38Z",
    scene_count: 7,
    duration_seconds: 184,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: null,
  },
  {
    id: "fixture-film-002",
    title: "Coffee at Midnight",
    state: "complete",
    created_at: "2026-04-19T09:02:14Z",
    completed_at: "2026-04-19T09:07:51Z",
    scene_count: 5,
    duration_seconds: 142,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-04-19T09:08:30Z",
  },
  {
    id: "fixture-film-003",
    title: "Letters from the West Bank",
    state: "complete",
    created_at: "2026-04-15T21:48:02Z",
    completed_at: "2026-04-15T21:55:09Z",
    scene_count: 9,
    duration_seconds: 251,
    cover_image_url: null,
    is_incomplete: true,
    viewed_at: "2026-04-15T21:56:00Z",
  },
  {
    id: "fixture-film-004",
    title: "Untitled draft",
    state: "canceled",
    created_at: "2026-04-12T11:30:11Z",
    completed_at: null,
    scene_count: 0,
    duration_seconds: null,
    cover_image_url: null,
    viewed_at: "2026-04-12T11:32:00Z",
  },
  {
    id: "fixture-film-005",
    title: "A Slow Tide",
    state: "complete",
    created_at: "2026-04-10T08:14:00Z",
    completed_at: "2026-04-10T08:19:02Z",
    scene_count: 6,
    duration_seconds: 167,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-04-10T08:21:00Z",
  },
  {
    id: "fixture-film-006",
    title: "Postcard from Lisbon",
    state: "complete",
    created_at: "2026-04-08T22:00:11Z",
    completed_at: "2026-04-08T22:06:55Z",
    scene_count: 4,
    duration_seconds: 121,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-04-08T22:07:00Z",
  },
  {
    id: "fixture-film-007",
    title: "The Wire House",
    state: "error",
    created_at: "2026-04-05T13:42:00Z",
    completed_at: null,
    scene_count: 8,
    duration_seconds: null,
    cover_image_url: null,
    viewed_at: "2026-04-05T13:48:00Z",
  },
  {
    id: "fixture-film-008",
    title: "Ridgeline",
    state: "complete",
    created_at: "2026-04-02T17:21:00Z",
    completed_at: "2026-04-02T17:28:14Z",
    scene_count: 7,
    duration_seconds: 198,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-04-02T17:29:00Z",
  },
  {
    id: "fixture-film-009",
    title: "Two Sisters, Walking",
    state: "complete",
    created_at: "2026-03-30T10:11:00Z",
    completed_at: "2026-03-30T10:16:48Z",
    scene_count: 5,
    duration_seconds: 138,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-03-30T10:17:00Z",
  },
  {
    id: "fixture-film-010",
    title: "Where the Light Falls",
    state: "complete",
    created_at: "2026-03-27T19:50:00Z",
    completed_at: "2026-03-27T19:57:33Z",
    scene_count: 8,
    duration_seconds: 224,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-03-27T19:58:00Z",
  },
  {
    id: "fixture-film-011",
    title: "Last Train North",
    state: "complete",
    created_at: "2026-03-22T07:38:00Z",
    completed_at: "2026-03-22T07:44:10Z",
    scene_count: 6,
    duration_seconds: 161,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-03-22T07:45:00Z",
  },
  {
    id: "fixture-film-012",
    title: "Quiet Things",
    state: "complete",
    created_at: "2026-03-18T14:02:00Z",
    completed_at: "2026-03-18T14:08:40Z",
    scene_count: 4,
    duration_seconds: 116,
    cover_image_url: null,
    is_incomplete: false,
    viewed_at: "2026-03-18T14:09:00Z",
  },
];

function applyFixtureSort(list: FilmSummary[], sort: FilmsSort): FilmSummary[] {
  const copy = [...list];
  switch (sort) {
    case "created_asc":
      copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
      break;
    case "title_asc":
      copy.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "created_desc":
    default:
      copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return copy;
}

function applyFixtureSearch(
  list: FilmSummary[],
  search: string | undefined,
): FilmSummary[] {
  if (!search) return list;
  const needle = search.toLowerCase();
  return list.filter((f) => f.title.toLowerCase().includes(needle));
}

function ProjectsFixtures() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<FilmsSort>("created_desc");
  const [statusFilter, setStatusFilter] = useState<FilmsStatusFilter>("all");
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset pagination whenever search, sort, or filter changes — pages cached
  // under one filter shouldn't bleed into another (matches the real query-key
  // strategy in src/hooks/use-films.ts → filmsQueryKeys.list).
  useEffect(() => {
    setPageCount(1);
  }, [debouncedSearch, sort, statusFilter]);

  // All films loaded so far (search + sort applied, NO status filter). The
  // toolbar uses this for chip counts; the grid filters further below.
  const loaded = useMemo(
    () =>
      applyFixtureSearch(applyFixtureSort(FIXTURE_FILMS, sort), debouncedSearch).slice(
        0,
        pageCount * FIXTURE_PAGE_SIZE,
      ),
    [sort, debouncedSearch, pageCount],
  );

  const filtered = useMemo(
    () => loaded.filter((f) => matchesStatusFilter(f.state, statusFilter)),
    [loaded, statusFilter],
  );

  const hasNextPage = loaded.length < FIXTURE_FILMS.length;

  const inProgressQuery = useInProgressFilm();
  const inProgressFilm = inProgressQuery.data ?? null;

  return (
    <ProjectsView
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      debouncedSearch={debouncedSearch}
      sort={sort}
      setSort={setSort}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      films={filtered}
      loadedFilms={loaded}
      inProgressFilm={inProgressFilm}
      isLoading={false}
      isError={false}
      hasNextPage={hasNextPage}
      isFetchingNextPage={false}
      fetchNextPage={() => setPageCount((c) => c + 1)}
      onDelete={() => {}}
      onRename={() => {}}
      onDuplicate={() => {}}
    />
  );
}

// ---------------------------------------------------------------------------
// Real-hook sub-component — calls Stratum's useInfiniteFilms.
// ---------------------------------------------------------------------------

function ProjectsWithHooks() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<FilmsSort>("created_desc");
  const [statusFilter, setStatusFilter] = useState<FilmsStatusFilter>("all");

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFilms({
    search: debouncedSearch || undefined,
    sort,
  });

  const inProgressQuery = useInProgressFilm();
  const deleteFilm = useDeleteFilm();
  const renameFilm = useRenameFilm();
  const duplicateFilm = useDuplicateFilm();

  // All films loaded so far (no status filter applied). Drives chip counts.
  const loadedFilms = useMemo<FilmSummary[]>(
    () => data?.pages.flatMap((p) => p.films) ?? [],
    [data],
  );

  // Status filter is applied client-side over the loaded pages today.
  // Stratum's hook contract may grow a `status` param in S6.
  const films = useMemo<FilmSummary[]>(
    () => loadedFilms.filter((f) => matchesStatusFilter(f.state, statusFilter)),
    [loadedFilms, statusFilter],
  );

  return (
    <ProjectsView
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      debouncedSearch={debouncedSearch}
      sort={sort}
      setSort={setSort}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      films={films}
      loadedFilms={loadedFilms}
      inProgressFilm={inProgressQuery.data ?? null}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage ?? false}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={() => fetchNextPage()}
      onDelete={(f) => deleteFilm.mutate({ id: f.id })}
      onRename={(f) => renameFilm.mutate({ id: f.id })}
      onDuplicate={(f) => duplicateFilm.mutate({ id: f.id })}
    />
  );
}

// ---------------------------------------------------------------------------
// Presentational view — receives data + handlers as props.
// ---------------------------------------------------------------------------

type ProjectsViewProps = {
  searchInput: string;
  setSearchInput: (next: string) => void;
  debouncedSearch: string;
  sort: FilmsSort;
  setSort: (next: FilmsSort) => void;
  statusFilter: FilmsStatusFilter;
  setStatusFilter: (next: FilmsStatusFilter) => void;
  /** Films after status-filter is applied. Used by the grid. */
  films: FilmSummary[];
  /** All films loaded so far, no status filter applied. Drives chip counts
   *  and the pinned shelf (which doesn't respond to filters). */
  loadedFilms: FilmSummary[];
  /** The single in-progress film, if any. */
  inProgressFilm: FilmSummary | null;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onDelete: (film: FilmSummary) => void;
  onRename: (film: FilmSummary) => void;
  onDuplicate: (film: FilmSummary) => void;
};

function ProjectsView({
  searchInput,
  setSearchInput,
  debouncedSearch,
  sort,
  setSort,
  statusFilter,
  setStatusFilter,
  films,
  loadedFilms,
  inProgressFilm,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onDelete,
  onRename,
  onDuplicate,
}: ProjectsViewProps) {
  const { isSeen, markSeen } = useSeenFilms();
  const stillLoading = useStillLoading(isLoading);

  // Undo-on-delete (Settings_Projects_Brief A.6 + A.7 §7).
  // Films enter the "pending delete" set on confirm, are hidden from the
  // grid for UNDO_TIMEOUT_MS, and either:
  //   - get restored if the user clicks Undo, or
  //   - get sent through the real onDelete handler when the timer fires.
  // This matches the spec's semantics without coupling to TanStack
  // mutation cancellation — fixture mutations resolve immediately and
  // there's nothing to abort. Real mutations get the same window because
  // we delay the `onDelete` call by UNDO_TIMEOUT_MS rather than firing it
  // and then trying to roll back.
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  // Track the timer per film so we can cancel on undo.
  const undoTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return () => {
      // Component unmount — drain remaining timers. We deliberately do NOT
      // commit the pending deletes here; if the user navigated away, the
      // safer default is to not destroy their work.
      for (const id of undoTimersRef.current.values()) {
        window.clearTimeout(id);
      }
      undoTimersRef.current.clear();
    };
  }, []);

  const handleDelete = useCallback(
    (film: FilmSummary) => {
      setPendingDeletes((prev) => {
        const next = new Set(prev);
        next.add(film.id);
        return next;
      });

      const commit = window.setTimeout(() => {
        undoTimersRef.current.delete(film.id);
        // Fire the real mutation and clear the pending flag. The mutation
        // is responsible for invalidating the cache; the pending set was
        // only there to hide the row during the undo window.
        onDelete(film);
        setPendingDeletes((prev) => {
          if (!prev.has(film.id)) return prev;
          const next = new Set(prev);
          next.delete(film.id);
          return next;
        });
      }, UNDO_TIMEOUT_MS);
      undoTimersRef.current.set(film.id, commit);

      toast(globalToasts.filmDeleted.title, {
        description: film.title,
        duration: UNDO_TIMEOUT_MS,
        action: {
          label: globalToasts.filmDeleted.action,
          onClick: () => {
            const t = undoTimersRef.current.get(film.id);
            if (t) {
              window.clearTimeout(t);
              undoTimersRef.current.delete(film.id);
            }
            setPendingDeletes((prev) => {
              if (!prev.has(film.id)) return prev;
              const next = new Set(prev);
              next.delete(film.id);
              return next;
            });
            toast(globalToasts.filmDeleteUndone);
          },
        },
      });
    },
    [onDelete],
  );

  // Visible films exclude anything in the undo window.
  const visibleFilms = useMemo(
    () => films.filter((f) => !pendingDeletes.has(f.id)),
    [films, pendingDeletes],
  );
  const visibleLoaded = useMemo(
    () => loadedFilms.filter((f) => !pendingDeletes.has(f.id)),
    [loadedFilms, pendingDeletes],
  );

  // Intersection observer-driven infinite scroll. 300px rootMargin keeps the
  // next page firing before the user hits the end so scrolling stays smooth.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) fetchNextPage();
      },
      { rootMargin: "300px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasFilters =
    statusFilter !== "all" || debouncedSearch.length > 0 || sort !== "created_desc";
  const noResultsForFilters =
    !isLoading &&
    visibleFilms.length === 0 &&
    (statusFilter !== "all" || debouncedSearch.length > 0);
  const noFilmsAtAll =
    !isLoading &&
    visibleLoaded.length === 0 &&
    !inProgressFilm &&
    debouncedSearch.length === 0 &&
    statusFilter === "all";

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setSort("created_desc");
  };

  // Smart grouping (Settings_Projects_Brief A.4.5). Newest-first sort, no
  // search, total visible film count ≥ threshold. If any condition fails,
  // we render a flat grid.
  const groupingActive =
    sort === "created_desc" &&
    debouncedSearch.length === 0 &&
    visibleFilms.length >= RECENCY_GROUP_THRESHOLD;
  const groupedFilms = useMemo(
    () => (groupingActive ? groupFilmsByRecency(visibleFilms) : null),
    [groupingActive, visibleFilms],
  );

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-h1 text-foreground">{projects.pageHeading}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={projects.searchPlaceholder}
              aria-label={projects.searchPlaceholder}
              className="pl-9"
            />
          </div>
          <SortDropdown value={sort} onChange={setSort} />
          <Button asChild className="ml-auto sm:ml-0">
            <Link href="/home">
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              {projects.newFilmButton}
            </Link>
          </Button>
        </div>

        <StatusFilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          loadedFilms={visibleLoaded}
        />
      </header>

      {isLoading ? (
        <ProjectsGridSkeleton />
      ) : isError ? (
        <ProjectsError />
      ) : noFilmsAtAll ? (
        <NoFilmsEmptyState showFreeFilmsHint={false} />
      ) : noResultsForFilters ? (
        <NoResultsState
          query={debouncedSearch}
          onClear={clearFilters}
          hasFilters={hasFilters}
        />
      ) : (
        <>
          {/* Pinned shelf — gated to ≥6 films OR any in-progress film. The
              shelf shows recent + in-progress regardless of the status
              filter applied to the grid below. */}
          <PinnedShelf
            films={visibleLoaded}
            inProgressFilm={inProgressFilm}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={handleDelete}
          />

          {groupedFilms ? (
            <div className="flex flex-col gap-8">
              {groupedFilms.map((group) => (
                <section
                  key={group.key}
                  aria-label={group.label}
                  className="flex flex-col gap-3"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {group.label}
                  </p>
                  <FilmCardGrid layout="grid" aria-label={group.label}>
                    {group.films.map((film) => (
                      <li key={film.id}>
                        <FilmCard
                          film={film}
                          isNew={
                            film.state === "complete" && !isSeen(film.id)
                          }
                          onOpen={(f) => markSeen(f.id)}
                          onDelete={handleDelete}
                          onRename={onRename}
                          onDuplicate={onDuplicate}
                        />
                      </li>
                    ))}
                  </FilmCardGrid>
                </section>
              ))}
            </div>
          ) : (
            <FilmCardGrid layout="grid" aria-label={projects.pageHeading}>
              {visibleFilms.map((film) => (
                <li key={film.id}>
                  <FilmCard
                    film={film}
                    isNew={film.state === "complete" && !isSeen(film.id)}
                    onOpen={(f) => markSeen(f.id)}
                    onDelete={handleDelete}
                    onRename={onRename}
                    onDuplicate={onDuplicate}
                  />
                </li>
              ))}
            </FilmCardGrid>
          )}

          <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          <div className="flex justify-center pb-4 text-small text-muted-foreground">
            {isFetchingNextPage ? (
              <span role="status" aria-live="polite">
                {projects.loadingMore}
              </span>
            ) : !hasNextPage && visibleFilms.length > 0 ? (
              <span>{projects.endOfList}</span>
            ) : null}
          </div>
        </>
      )}

      {stillLoading ? (
        <p
          className="text-small text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {stillLoadingCopy}
        </p>
      ) : null}
    </div>
  );
}

function StatusFilterChips({
  value,
  onChange,
  loadedFilms,
}: {
  value: FilmsStatusFilter;
  onChange: (next: FilmsStatusFilter) => void;
  /** Films loaded so far (no status filter applied). Drives the per-chip
   *  count badge — surfaces "loaded so far" honestly. */
  loadedFilms: ReadonlyArray<FilmSummary>;
}) {
  const counts = useMemo(() => {
    const c: Record<FilmsStatusFilter, number> = {
      all: loadedFilms.length,
      in_progress: 0,
      complete: 0,
      error: 0,
    };
    for (const f of loadedFilms) {
      if (matchesStatusFilter(f.state, "in_progress")) c.in_progress += 1;
      if (matchesStatusFilter(f.state, "complete")) c.complete += 1;
      if (matchesStatusFilter(f.state, "error")) c.error += 1;
    }
    return c;
  }, [loadedFilms]);

  return (
    <ToggleGroup
      type="single"
      value={value}
      // Radix returns "" when the user toggles the active item off. Coerce
      // back to "all" so the filter is never in a no-state limbo.
      onValueChange={(next) =>
        onChange((next || "all") as FilmsStatusFilter)
      }
      variant="outline"
      size="sm"
      aria-label={projects.filter.label}
      className="flex flex-wrap justify-start gap-2"
    >
      {STATUS_FILTERS.map((option) => {
        const count = counts[option.value];
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={`${option.label} (${count})`}
            className="gap-1.5"
          >
            <span>{option.label}</span>
            <span aria-hidden="true" className="text-muted-foreground">
              · {count}
            </span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: FilmsSort;
  onChange: (next: FilmsSort) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as FilmsSort)}>
      <SelectTrigger
        aria-label={projects.sort.label}
        // Match the toolbar's h-11 (44px touch floor) and let the trigger
        // shrink to its content rather than stretching to fill the row.
        className="h-11 w-auto min-w-[12rem] gap-2"
      >
        <span className="text-muted-foreground">{projects.sort.label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {(Object.keys(SORT_LABELS) as FilmsSort[]).map((option) => (
          <SelectItem key={option} value={option}>
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProjectsGridSkeleton() {
  return (
    <FilmCardGrid layout="grid" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}>
          <FilmCardSkeleton />
        </li>
      ))}
    </FilmCardGrid>
  );
}

function ProjectsError() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <h2 className="text-h2 text-foreground">Your films didn&apos;t load.</h2>
      <p className="text-body text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  );
}

/** Empty-results state shown when search/filter return nothing across the
 *  loaded set. Distinct from `<NoFilmsEmptyState />` (which is shown when
 *  the user has no films at all and we don't want to imply they're missing
 *  ones to a filter). */
function NoResultsState({
  query,
  onClear,
  hasFilters,
}: {
  query: string;
  onClear: () => void;
  hasFilters: boolean;
}) {
  const headline = query
    ? `Nothing matched “${query}”.`
    : projects.noFiltersHeadline;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <h2 className="text-h2 text-foreground">{headline}</h2>
      <p className="text-body text-muted-foreground">
        {projects.noFiltersBody}
      </p>
      {hasFilters ? (
        <Button variant="ghost" onClick={onClear}>
          {projects.clearFilters}
        </Button>
      ) : null}
    </div>
  );
}
