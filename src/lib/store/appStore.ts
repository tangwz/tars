import { create } from "zustand";
import type { Locale } from "../i18n/types";

export type ThemeMode = "light" | "dark";

export interface AppStoreState {
  theme: ThemeMode;
  locale: Locale;
  currentProjectPath: string | null;
  startupError: string;
}

export interface AppStoreActions {
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
  setCurrentProject: (path: string | null) => void;
  setStartupError: (message: string) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>((set) => ({
  theme: "light",
  locale: "en",
  currentProjectPath: null,
  startupError: "",
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
  setCurrentProject: (path) => set({ currentProjectPath: path }),
  setStartupError: (message) => set({ startupError: message }),
}));

export const appSelectors = {
  theme: (state: AppStore) => state.theme,
  locale: (state: AppStore) => state.locale,
  setLocale: (state: AppStore) => state.setLocale,
  toggleTheme: (state: AppStore) => state.toggleTheme,
  currentProjectPath: (state: AppStore) => state.currentProjectPath,
  startupError: (state: AppStore) => state.startupError,
};
