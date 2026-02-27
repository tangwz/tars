import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface UIState {
  theme: ThemeMode;
  startupError: string;
  isLoadingRecent: boolean;
  isOpeningProject: boolean;
  isSettingsOpen: boolean;
}

interface UIActions {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setStartupError: (message: string) => void;
  setIsLoadingRecent: (value: boolean) => void;
  setIsOpeningProject: (value: boolean) => void;
  setIsSettingsOpen: (value: boolean) => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  theme: "light",
  startupError: "",
  isLoadingRecent: true,
  isOpeningProject: false,
  isSettingsOpen: false,
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
  setStartupError: (message) => set({ startupError: message }),
  setIsLoadingRecent: (value) => set({ isLoadingRecent: value }),
  setIsOpeningProject: (value) => set({ isOpeningProject: value }),
  setIsSettingsOpen: (value) => set({ isSettingsOpen: value }),
}));

export const uiSelectors = {
  theme: (state: UIStore) => state.theme,
  startupError: (state: UIStore) => state.startupError,
  isLoadingRecent: (state: UIStore) => state.isLoadingRecent,
  isOpeningProject: (state: UIStore) => state.isOpeningProject,
  isSettingsOpen: (state: UIStore) => state.isSettingsOpen,
};

