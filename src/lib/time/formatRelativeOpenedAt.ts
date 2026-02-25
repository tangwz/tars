const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_WINDOW_MS = 30 * DAY_MS;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatRelativeOpenedAt(openedAt: number, nowMs = Date.now()): string {
  if (!Number.isFinite(openedAt) || openedAt <= 0 || !Number.isFinite(nowMs) || nowMs <= 0) {
    return "just now";
  }

  const delta = nowMs - openedAt;

  if (delta <= 0 || delta < MINUTE_MS) {
    return "just now";
  }

  if (delta < HOUR_MS) {
    return `${Math.floor(delta / MINUTE_MS)}m ago`;
  }

  if (delta < DAY_MS) {
    return `${Math.floor(delta / HOUR_MS)}h ago`;
  }

  if (delta < MONTH_WINDOW_MS) {
    return `${Math.floor(delta / DAY_MS)}d ago`;
  }

  return dateFormatter.format(new Date(openedAt));
}
