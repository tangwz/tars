import { create } from "zustand";
import type { RuntimeId, RuntimeKind } from "@/features/runtime/runtimeTypes";

export type ThemeMode = "light" | "dark";

interface RuntimeModalState {
  isOpen: boolean;
  threadId: string | null;
  selectedRuntimeId: RuntimeId | null;
  filter: "all" | RuntimeKind;
  isVerifying: boolean;
  errorMessage: string;
  oauthPendingSessionId: string | null;
}

interface UIState {
  theme: ThemeMode;
  startupError: string;
  isLoadingRecent: boolean;
  isOpeningProject: boolean;
  isSettingsOpen: boolean;
  runtimeModal: RuntimeModalState;
}

interface UIActions {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setStartupError: (message: string) => void;
  setIsLoadingRecent: (value: boolean) => void;
  setIsOpeningProject: (value: boolean) => void;
  setIsSettingsOpen: (value: boolean) => void;
  openRuntimeModal: (input: { threadId: string; selectedRuntimeId: RuntimeId | null }) => void;
  closeRuntimeModal: () => void;
  setRuntimeModalSelectedRuntimeId: (runtimeId: RuntimeId) => void;
  setRuntimeModalFilter: (filter: RuntimeModalState["filter"]) => void;
  setRuntimeModalVerifying: (value: boolean) => void;
  setRuntimeModalErrorMessage: (message: string) => void;
  setRuntimeModalOAuthPendingSessionId: (sessionId: string | null) => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  theme: "light",
  startupError: "",
  isLoadingRecent: true,
  isOpeningProject: false,
  isSettingsOpen: false,
  runtimeModal: {
    isOpen: false,
    threadId: null,
    selectedRuntimeId: null,
    filter: "all",
    isVerifying: false,
    errorMessage: "",
    oauthPendingSessionId: null,
  },
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
  setStartupError: (message) => set({ startupError: message }),
  setIsLoadingRecent: (value) => set({ isLoadingRecent: value }),
  setIsOpeningProject: (value) => set({ isOpeningProject: value }),
  setIsSettingsOpen: (value) => set({ isSettingsOpen: value }),
  openRuntimeModal: ({ threadId, selectedRuntimeId }) =>
    set({
      runtimeModal: {
        isOpen: true,
        threadId,
        selectedRuntimeId,
        filter: "all",
        isVerifying: false,
        errorMessage: "",
        oauthPendingSessionId: null,
      },
    }),
  closeRuntimeModal: () =>
    set((state) => ({
      runtimeModal: {
        ...state.runtimeModal,
        isOpen: false,
        isVerifying: false,
        errorMessage: "",
        oauthPendingSessionId: null,
      },
    })),
  setRuntimeModalSelectedRuntimeId: (runtimeId) =>
    set((state) => ({
      runtimeModal: {
        ...state.runtimeModal,
        selectedRuntimeId: runtimeId,
        errorMessage: "",
      },
    })),
  setRuntimeModalFilter: (filter) =>
    set((state) => ({
      runtimeModal: {
        ...state.runtimeModal,
        filter,
      },
    })),
  setRuntimeModalVerifying: (value) =>
    set((state) => ({
      runtimeModal: {
        ...state.runtimeModal,
        isVerifying: value,
      },
    })),
  setRuntimeModalErrorMessage: (message) =>
    set((state) => ({
      runtimeModal: {
        ...state.runtimeModal,
        errorMessage: message,
      },
    })),
  setRuntimeModalOAuthPendingSessionId: (sessionId) =>
    set((state) => ({
      runtimeModal: {
        ...state.runtimeModal,
        oauthPendingSessionId: sessionId,
      },
    })),
}));

export const uiSelectors = {
  theme: (state: UIStore) => state.theme,
  startupError: (state: UIStore) => state.startupError,
  isLoadingRecent: (state: UIStore) => state.isLoadingRecent,
  isOpeningProject: (state: UIStore) => state.isOpeningProject,
  isSettingsOpen: (state: UIStore) => state.isSettingsOpen,
  runtimeModal: (state: UIStore) => state.runtimeModal,
};
