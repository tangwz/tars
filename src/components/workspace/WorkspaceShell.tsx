import { useEffect, useMemo } from "react";
import { FolderPlus } from "lucide-react";
import { t } from "@/i18n/translate";
import { type RecentProject } from "@/services/persistence/projectRepository";
import { localeSelectors, useLocaleStore } from "@/stores/localeStore";
import { uiSelectors, useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore, workspaceSelectors } from "@/stores/workspaceStore";
import { IconButton } from "@/components/ui/IconButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProjectList } from "@/components/workspace/ProjectList";
import { SettingsMenu } from "@/components/workspace/SettingsMenu";
import { ThreadPanel } from "@/components/workspace/ThreadPanel";
import { buildMockWorkspaceData } from "@/components/workspace/mockWorkspaceThreads";

interface WorkspaceShellProps {
  currentProjectPath: string;
  recentProjects: RecentProject[];
  isAddingProject: boolean;
  onAddProject: () => Promise<void>;
  onOpenSettings: () => void;
}

function getProjectName(path: string): string {
  const normalized = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return normalized[normalized.length - 1] ?? path;
}

export function WorkspaceShell(props: WorkspaceShellProps) {
  const locale = useLocaleStore(localeSelectors.locale);
  const selectedProjectPath = useWorkspaceStore(workspaceSelectors.selectedProjectPath);
  const selectedThreadId = useWorkspaceStore(workspaceSelectors.selectedThreadId);
  const isSettingsOpen = useUIStore(uiSelectors.isSettingsOpen);

  const projectSections = useMemo<RecentProject[]>(() => {
    if (props.recentProjects.length > 0) {
      return props.recentProjects;
    }

    return [
      {
        path: props.currentProjectPath,
        name: getProjectName(props.currentProjectPath),
        openedAt: Date.now(),
      },
    ];
  }, [props.currentProjectPath, props.recentProjects]);

  const workspaceData = useMemo(() => buildMockWorkspaceData(locale, projectSections), [locale, projectSections]);

  useEffect(() => {
    const currentValue = useWorkspaceStore.getState().selectedProjectPath;
    const hasCurrent = projectSections.some((project) => project.path === currentValue);

    if (hasCurrent) {
      return;
    }

    const nextProjectPath =
      projectSections.find((project) => project.path === props.currentProjectPath)?.path ??
      projectSections[0]?.path ??
      props.currentProjectPath;

    useWorkspaceStore.getState().setSelectedProjectPath(nextProjectPath);
  }, [projectSections, props.currentProjectPath]);

  const activeThreads = useMemo(
    () => (selectedProjectPath ? workspaceData.threadsByProject[selectedProjectPath] ?? [] : []),
    [selectedProjectPath, workspaceData.threadsByProject],
  );

  const selectedThreadDetail = useMemo(() => {
    if (selectedThreadId) {
      return workspaceData.detailsById[selectedThreadId] ?? null;
    }

    return activeThreads[0] ? workspaceData.detailsById[activeThreads[0].id] ?? null : null;
  }, [activeThreads, selectedThreadId, workspaceData.detailsById]);

  useEffect(() => {
    const currentThreadId = useWorkspaceStore.getState().selectedThreadId;

    if (activeThreads.some((thread) => thread.id === currentThreadId)) {
      return;
    }

    useWorkspaceStore.getState().setSelectedThreadId(activeThreads[0]?.id ?? null);
  }, [activeThreads]);

  return (
    <main className="workspace-layout">
      <aside className="workspace-sidebar">
        <div aria-hidden="true" className="workspace-sidebar-titlebar" data-tauri-drag-region />

        <SectionHeader
          actions={
            <IconButton
              className="workspace-add-project-button"
              disabled={props.isAddingProject}
              label={t(locale, "workspace.addProject")}
              onClick={() => {
                void props.onAddProject();
              }}
            >
              <FolderPlus className="workspace-action-icon" />
            </IconButton>
          }
          actionsClassName="window-no-drag"
          className="workspace-sidebar-header"
          title={t(locale, "workspace.threadsTitle")}
        />

        <div className="workspace-thread-scroll">
          <ProjectList
            locale={locale}
            onSelectThread={(projectPath, thread) => {
              useWorkspaceStore.getState().setSelectedProjectPath(projectPath);
              useWorkspaceStore.getState().setSelectedThreadId(thread.id);
            }}
            projects={projectSections}
            selectedThreadId={selectedThreadId}
            threadsByProject={workspaceData.threadsByProject}
          />
        </div>

        <footer className="workspace-sidebar-footer">
          <SettingsMenu
            isOpen={isSettingsOpen}
            locale={locale}
            onClose={() => {
              useUIStore.getState().setIsSettingsOpen(false);
            }}
            onOpenSettings={() => {
              useUIStore.getState().setIsSettingsOpen(false);
              props.onOpenSettings();
            }}
            onToggle={() => {
              useUIStore.getState().setIsSettingsOpen(!useUIStore.getState().isSettingsOpen);
            }}
          />
        </footer>
      </aside>

      <section aria-label={t(locale, "workspace.mainPanelAria")} className="workspace-main">
        {selectedThreadDetail ? <ThreadPanel detail={selectedThreadDetail} locale={locale} recentProjects={projectSections} /> : null}
      </section>
    </main>
  );
}
