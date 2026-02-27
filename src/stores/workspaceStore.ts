import { create } from "zustand";
import type { RecentProject } from "@/services/persistence/projectRepository";

interface WorkspaceState {
  currentProjectPath: string | null;
  recentProjects: RecentProject[];
  selectedProjectPath: string | null;
  selectedThreadId: string | null;
  isDatabaseReady: boolean;
}

interface WorkspaceActions {
  setCurrentProjectPath: (path: string | null) => void;
  setRecentProjects: (projects: RecentProject[]) => void;
  setSelectedProjectPath: (path: string | null) => void;
  setSelectedThreadId: (id: string | null) => void;
  setDatabaseReady: (value: boolean) => void;
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentProjectPath: null,
  recentProjects: [],
  selectedProjectPath: null,
  selectedThreadId: null,
  isDatabaseReady: false,
  setCurrentProjectPath: (path) => set({ currentProjectPath: path }),
  setRecentProjects: (projects) => set({ recentProjects: projects }),
  setSelectedProjectPath: (path) => set({ selectedProjectPath: path }),
  setSelectedThreadId: (id) => set({ selectedThreadId: id }),
  setDatabaseReady: (value) => set({ isDatabaseReady: value }),
}));

export const workspaceSelectors = {
  currentProjectPath: (state: WorkspaceStore) => state.currentProjectPath,
  recentProjects: (state: WorkspaceStore) => state.recentProjects,
  selectedProjectPath: (state: WorkspaceStore) => state.selectedProjectPath,
  selectedThreadId: (state: WorkspaceStore) => state.selectedThreadId,
  isDatabaseReady: (state: WorkspaceStore) => state.isDatabaseReady,
};

