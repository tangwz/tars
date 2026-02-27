import { StartupScreen } from "@/components/startup/StartupScreen";
import { useProjectActions } from "@/hooks/useProjectActions";
import { uiSelectors, useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore, workspaceSelectors } from "@/stores/workspaceStore";

export function StartupPage() {
  const isLoading = useUIStore(uiSelectors.isLoadingRecent);
  const isOpeningProject = useUIStore(uiSelectors.isOpeningProject);
  const errorMessage = useUIStore(uiSelectors.startupError);
  const recentProjects = useWorkspaceStore(workspaceSelectors.recentProjects);
  const { openProjectFromDialog, openRecentProject } = useProjectActions();

  return (
    <StartupScreen
      errorMessage={errorMessage}
      isLoading={isLoading}
      isOpeningProject={isOpeningProject}
      onOpenProject={openProjectFromDialog}
      onSelectRecentProject={openRecentProject}
      recentProjects={recentProjects}
    />
  );
}

