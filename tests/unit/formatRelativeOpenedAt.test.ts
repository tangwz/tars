import { describe, expect, it } from "vitest";
import { formatRelativeOpenedAt } from "../../src/lib/time/formatRelativeOpenedAt";

describe("formatRelativeOpenedAt", () => {
  const now = Date.UTC(2026, 1, 25, 12, 0, 0);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  it("returns just now for invalid timestamps", () => {
    expect(formatRelativeOpenedAt(0, now)).toBe("just now");
    expect(formatRelativeOpenedAt(-1, now)).toBe("just now");
    expect(formatRelativeOpenedAt(Number.NaN, now)).toBe("just now");
  });

  it("returns just now for future timestamps", () => {
    expect(formatRelativeOpenedAt(now + minute, now)).toBe("just now");
  });

  it("formats minutes, hours and days windows", () => {
    expect(formatRelativeOpenedAt(now - 59_000, now)).toBe("just now");
    expect(formatRelativeOpenedAt(now - minute, now)).toBe("1m ago");
    expect(formatRelativeOpenedAt(now - hour, now)).toBe("1h ago");
    expect(formatRelativeOpenedAt(now - day, now)).toBe("1d ago");
    expect(formatRelativeOpenedAt(now - 29 * day, now)).toBe("29d ago");
  });

  it("falls back to month-day formatting after 30 days", () => {
    const openedAt = now - 45 * day;
    const expected = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(openedAt));

    expect(formatRelativeOpenedAt(openedAt, now)).toBe(expected);
  });
});
