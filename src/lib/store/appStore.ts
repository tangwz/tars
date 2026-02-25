import { create } from "zustand";

export type ThemeMode = "light" | "dark";

export interface AppStoreState {
  theme: ThemeMode;
  currentProjectPath: string | null;
  startupError: string;
}

export interface AppStoreActions {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCurrentProject: (path: string | null) => void;
  setStartupError: (message: string) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>((set) => ({
  theme: "light",
  currentProjectPath: null,
  startupError: "",
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
  setCurrentProject: (path) => set({ currentProjectPath: path }),
  setStartupError: (message) => set({ startupError: message }),
}));

export const appSelectors = {
  theme: (state: AppStore) => state.theme,
  toggleTheme: (state: AppStore) => state.toggleTheme,
  currentProjectPath: (state: AppStore) => state.currentProjectPath,
  startupError: (state: AppStore) => state.startupError,
};
