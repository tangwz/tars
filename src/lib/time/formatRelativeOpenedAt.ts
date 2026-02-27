import type { Locale } from "../i18n/types";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_WINDOW_MS = 30 * DAY_MS;

const dateFormatters = {
  en: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }),
  "zh-CN": new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }),
} as const;

function formatUnits(amount: number, unit: "minute" | "hour" | "day", locale: Locale): string {
  if (locale === "zh-CN") {
    if (unit === "minute") {
      return `${amount}分钟前`;
    }

    if (unit === "hour") {
      return `${amount}小时前`;
    }

    return `${amount}天前`;
  }

  if (unit === "minute") {
    return `${amount}m ago`;
  }

  if (unit === "hour") {
    return `${amount}h ago`;
  }

  return `${amount}d ago`;
}

export function formatRelativeOpenedAt(openedAt: number, nowMs = Date.now(), locale: Locale = "en"): string {
  if (!Number.isFinite(openedAt) || openedAt <= 0 || !Number.isFinite(nowMs) || nowMs <= 0) {
    return locale === "zh-CN" ? "刚刚" : "just now";
  }

  const delta = nowMs - openedAt;

  if (delta <= 0 || delta < MINUTE_MS) {
    return locale === "zh-CN" ? "刚刚" : "just now";
  }

  if (delta < HOUR_MS) {
    return formatUnits(Math.floor(delta / MINUTE_MS), "minute", locale);
  }

  if (delta < DAY_MS) {
    return formatUnits(Math.floor(delta / HOUR_MS), "hour", locale);
  }

  if (delta < MONTH_WINDOW_MS) {
    return formatUnits(Math.floor(delta / DAY_MS), "day", locale);
  }

  return dateFormatters[locale].format(new Date(openedAt));
}
