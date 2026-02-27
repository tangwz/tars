import { create } from "zustand";
import type { Locale } from "@/i18n/types";

interface LocaleState {
  locale: Locale;
  isLocaleBootstrapped: boolean;
}

interface LocaleActions {
  setLocale: (locale: Locale) => void;
  setLocaleBootstrapped: (value: boolean) => void;
}

export type LocaleStore = LocaleState & LocaleActions;

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: "en",
  isLocaleBootstrapped: false,
  setLocale: (locale) => set({ locale }),
  setLocaleBootstrapped: (value) => set({ isLocaleBootstrapped: value }),
}));

export const localeSelectors = {
  locale: (state: LocaleStore) => state.locale,
  isLocaleBootstrapped: (state: LocaleStore) => state.isLocaleBootstrapped,
};

