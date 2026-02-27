import { useEffect } from "react";
import {
  initializeProjectDatabase,
  listRecentProjects,
} from "@/services/persistence/projectRepository";
import { useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const RECENT_PROJECT_LIMIT = 5;

export function useWorkspaceBootstrap() {
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        await initializeProjectDatabase();

        if (!active) {
          return;
        }

        const projects = await listRecentProjects(RECENT_PROJECT_LIMIT);

        if (!active) {
          return;
        }

        useWorkspaceStore.getState().setRecentProjects(projects);
        useWorkspaceStore.getState().setDatabaseReady(true);
      } catch (error) {
        useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
      } finally {
        if (active) {
          useUIStore.getState().setIsLoadingRecent(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);
}

