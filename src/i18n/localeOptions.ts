import type { TranslationKey } from "./messages";
import type { Locale } from "./types";

export interface LocaleOption {
  value: Locale;
  labelKey: TranslationKey;
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { value: "en", labelKey: "workspace.languageEnglish" },
  { value: "zh-CN", labelKey: "workspace.languageSimplifiedChinese" },
] as const;
