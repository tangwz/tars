import { messages, type TranslationKey } from "./messages";
import type { Locale } from "./types";

type TranslationParams = Record<string, string | number>;

const PARAM_PATTERN = /\{(\w+)\}/g;

function applyParams(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(PARAM_PATTERN, (raw, name: string) => {
    if (!(name in params)) {
      return raw;
    }

    return String(params[name]);
  });
}

export function t(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const catalog = messages[locale] ?? messages.en;
  const template = catalog[key] ?? messages.en[key] ?? key;
  return applyParams(template, params);
}

