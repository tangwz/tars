import { describe, expect, it } from "vitest";
import { formatRelativeOpenedAt } from "../../src/lib/time/formatRelativeOpenedAt";

describe("formatRelativeOpenedAt", () => {
  const now = Date.UTC(2026, 1, 25, 12, 0, 0);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  it("returns just now for invalid timestamps", () => {
    expect(formatRelativeOpenedAt(0, now, "en")).toBe("just now");
    expect(formatRelativeOpenedAt(-1, now, "en")).toBe("just now");
    expect(formatRelativeOpenedAt(Number.NaN, now, "en")).toBe("just now");
    expect(formatRelativeOpenedAt(0, now, "zh-CN")).toBe("刚刚");
  });

  it("returns just now for future timestamps", () => {
    expect(formatRelativeOpenedAt(now + minute, now, "en")).toBe("just now");
    expect(formatRelativeOpenedAt(now + minute, now, "zh-CN")).toBe("刚刚");
  });

  it("formats minutes, hours and days windows in english", () => {
    expect(formatRelativeOpenedAt(now - 59_000, now, "en")).toBe("just now");
    expect(formatRelativeOpenedAt(now - minute, now, "en")).toBe("1m ago");
    expect(formatRelativeOpenedAt(now - hour, now, "en")).toBe("1h ago");
    expect(formatRelativeOpenedAt(now - day, now, "en")).toBe("1d ago");
    expect(formatRelativeOpenedAt(now - 29 * day, now, "en")).toBe("29d ago");
  });

  it("formats minutes, hours and days windows in simplified chinese", () => {
    expect(formatRelativeOpenedAt(now - minute, now, "zh-CN")).toBe("1分钟前");
    expect(formatRelativeOpenedAt(now - hour, now, "zh-CN")).toBe("1小时前");
    expect(formatRelativeOpenedAt(now - day, now, "zh-CN")).toBe("1天前");
    expect(formatRelativeOpenedAt(now - 29 * day, now, "zh-CN")).toBe("29天前");
  });

  it("falls back to month-day formatting after 30 days in english", () => {
    const openedAt = now - 45 * day;
    const expected = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(openedAt));

    expect(formatRelativeOpenedAt(openedAt, now, "en")).toBe(expected);
  });

  it("falls back to month-day formatting after 30 days in simplified chinese", () => {
    const openedAt = now - 45 * day;
    const expected = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(openedAt));

    expect(formatRelativeOpenedAt(openedAt, now, "zh-CN")).toBe(expected);
  });
});
