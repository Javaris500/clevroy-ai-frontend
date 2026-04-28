/**
 * Lightweight relative-time formatter shared across surfaces that show
 * "Saved 2m ago" / "Last topped up 6d ago" style strings.
 */
export function formatRelative(epochMs: number, now: number = Date.now()): string {
  const diff = now - epochMs;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < 5_000) return "just now";
  if (diff < min) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
