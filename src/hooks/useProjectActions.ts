import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "@/i18n/translate";
import { localeSelectors, useLocaleStore } from "@/stores/localeStore";
import type { RecentProject } from "@/services/persistence/projectRepository";
import {
  listRecentProjects,
  removeRecentProject,
  setMeta,
  upsertRecentProject,
} from "@/services/persistence/projectRepository";
import { openProjectDirectory } from "@/services/tauri/dialogClient";
import { directoryExists } from "@/services/tauri/fsClient";
import { useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const RECENT_PROJECT_LIMIT = 5;

function getProjectName(path: string): string {
  const normalized = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return normalized[normalized.length - 1] ?? path;
}

async function refreshRecentProjects(): Promise<void> {
  const projects = await listRecentProjects(RECENT_PROJECT_LIMIT);
  useWorkspaceStore.getState().setRecentProjects(projects);
}

export function useProjectActions() {
  const navigate = useNavigate();
  const locale = useLocaleStore(localeSelectors.locale);

  const openProject = useCallback(
    async (path: string): Promise<boolean> => {
      useUIStore.getState().setIsOpeningProject(true);
      useUIStore.getState().setStartupError("");

      try {
        const isValid = await directoryExists(path);

        if (!isValid) {
          await removeRecentProject(path);
          await refreshRecentProjects();
          useUIStore.getState().setStartupError(t(locale, "error.projectPathUnavailable"));
          return false;
        }

        await upsertRecentProject({
          path,
          name: getProjectName(path),
        });
        await setMeta("last_project_path", path);
        await refreshRecentProjects();

        useWorkspaceStore.getState().setCurrentProjectPath(path);
        useWorkspaceStore.getState().setSelectedProjectPath(path);
        navigate("/workspace");
        return true;
      } catch (error) {
        useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
        return false;
      } finally {
        useUIStore.getState().setIsOpeningProject(false);
      }
    },
    [locale, navigate],
  );

  const openProjectFromDialog = useCallback(async (): Promise<void> => {
    try {
      const selectedPath = await openProjectDirectory();

      if (!selectedPath) {
        return;
      }

      await openProject(selectedPath);
    } catch (error) {
      useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
    }
  }, [openProject]);

  const openRecentProject = useCallback(
    async (project: RecentProject): Promise<void> => {
      await openProject(project.path);
    },
    [openProject],
  );

  return {
    openProject,
    openProjectFromDialog,
    openRecentProject,
  };
}

