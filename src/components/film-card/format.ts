// Display helpers for FilmCard. Kept here (not in src/lib/) because they are
// FilmCard-internal — the moment another surface needs them, promote.
//
// Date formatting uses the user's locale via Intl. Duration formatting is a
// simple m:ss because nothing in MVP is over an hour.

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
