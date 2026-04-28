import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { FilmSummary } from "@/types/film";
import { home } from "@/lib/copy";

type FilmInProgressCardProps = {
  film: FilmSummary;
};

// EC-G3: When the user has an active generation on another device (or in
// another tab), Home surfaces a "Film in progress" card at the top of the
// recent-films row with a live indicator. Tapping it deep-links to the
// generation screen on this device, where Fantem's CenterStage takes over via
// the same backend state.
//
// Visually distinct from a regular FilmCard — primary border + live dot —
// so the user notices it without reading.

export function FilmInProgressCard({ film }: FilmInProgressCardProps) {
  return (
    <Link
      href={`/films/${film.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-primary bg-card transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`${home.filmInProgressLabel}: ${film.title}`}
    >
      <div className="relative aspect-video w-full bg-muted">
        {film.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={film.cover_image_url}
            alt=""
            className="h-full w-full object-cover opacity-90"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="absolute right-2 top-2">
          <Badge className="gap-1.5 bg-primary text-primary-foreground">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground"
              aria-hidden="true"
            />
            {home.filmInProgressLiveLabel}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-caption uppercase tracking-wider text-primary">
          {home.filmInProgressLabel}
        </p>
        <h3 className="text-h3 font-semibold text-card-foreground line-clamp-1">
          {film.title}
        </h3>
      </div>
    </Link>
  );
}
