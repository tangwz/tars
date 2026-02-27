import { Navigate } from "react-router-dom";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { useProjectActions } from "@/hooks/useProjectActions";
import { uiSelectors, useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore, workspaceSelectors } from "@/stores/workspaceStore";

export function WorkspacePage() {
  const currentProjectPath = useWorkspaceStore(workspaceSelectors.currentProjectPath);
  const recentProjects = useWorkspaceStore(workspaceSelectors.recentProjects);
  const isAddingProject = useUIStore(uiSelectors.isOpeningProject);
  const { openProjectFromDialog } = useProjectActions();

  if (!currentProjectPath) {
    return <Navigate replace to="/" />;
  }

  return (
    <WorkspaceShell
      currentProjectPath={currentProjectPath}
      isAddingProject={isAddingProject}
      onAddProject={openProjectFromDialog}
      recentProjects={recentProjects}
    />
  );
}

