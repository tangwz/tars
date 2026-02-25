import { useCallback, useEffect, useState } from "react";
import { StartupScreen } from "./features/startup/StartupScreen";
import { WorkspaceShell } from "./features/workspace/WorkspaceShell";
import {
  initializeProjectDatabase,
  listRecentProjects,
  removeRecentProject,
  setMeta,
  type RecentProject,
  upsertRecentProject,
} from "./lib/persistence/projectRepository";
import { appSelectors, useAppStore } from "./lib/store/appStore";
import { openProjectDirectory } from "./lib/tauri/dialogClient";
import { directoryExists } from "./lib/tauri/fsClient";

function getProjectName(path: string): string {
  const normalized = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return normalized[normalized.length - 1] ?? path;
}

function App() {
  const theme = useAppStore(appSelectors.theme);
  const currentProjectPath = useAppStore(appSelectors.currentProjectPath);
  const startupError = useAppStore(appSelectors.startupError);

  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isOpeningProject, setIsOpeningProject] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", theme === "dark");
  }, [theme]);

  const loadRecentProjects = useCallback(async () => {
    const projects = await listRecentProjects(5);
    setRecentProjects(projects);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        await initializeProjectDatabase();

        if (!active) {
          return;
        }

        await loadRecentProjects();
      } catch (error) {
        useAppStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
      } finally {
        if (active) {
          setIsLoadingRecent(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [loadRecentProjects]);

  const openProject = useCallback(
    async (path: string) => {
      setIsOpeningProject(true);
      useAppStore.getState().setStartupError("");

      try {
        const isValid = await directoryExists(path);

        if (!isValid) {
          await removeRecentProject(path);
          await loadRecentProjects();
          useAppStore.getState().setStartupError("Project path is no longer available.");
          return;
        }

        await upsertRecentProject({
          path,
          name: getProjectName(path),
        });
        await setMeta("last_project_path", path);
        await loadRecentProjects();

        useAppStore.getState().setCurrentProject(path);
        setShowWorkspace(true);
      } catch (error) {
        useAppStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsOpeningProject(false);
      }
    },
    [loadRecentProjects],
  );

  const handleOpenProject = async () => {
    try {
      const selectedPath = await openProjectDirectory();

      if (!selectedPath) {
        return;
      }

      await openProject(selectedPath);
    } catch (error) {
      useAppStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleSelectRecentProject = async (project: RecentProject) => {
    await openProject(project.path);
  };

  const handleBackToStartup = () => {
    setShowWorkspace(false);
    useAppStore.getState().setStartupError("");
  };

  if (showWorkspace && currentProjectPath) {
    return <WorkspaceShell currentProjectPath={currentProjectPath} onBackToStartup={handleBackToStartup} />;
  }

  return (
    <StartupScreen
      errorMessage={startupError}
      isLoading={isLoadingRecent}
      isOpeningProject={isOpeningProject}
      onOpenProject={handleOpenProject}
      onSelectRecentProject={handleSelectRecentProject}
      recentProjects={recentProjects}
    />
  );
}

export default App;
