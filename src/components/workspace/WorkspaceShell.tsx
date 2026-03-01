import { useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus } from "lucide-react";
import { t } from "@/i18n/translate";
import { getMeta, setMeta } from "@/services/persistence/projectRepository";
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

const WORKSPACE_COLLAPSED_PROJECTS_META_KEY = "workspace_collapsed_project_paths";

function getProjectName(path: string): string {
  const normalized = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return normalized[normalized.length - 1] ?? path;
}

function parseCollapsedProjectPaths(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function WorkspaceShell(props: WorkspaceShellProps) {
  const locale = useLocaleStore(localeSelectors.locale);
  const isDatabaseReady = useWorkspaceStore(workspaceSelectors.isDatabaseReady);
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
  const [expandedProjectsByPath, setExpandedProjectsByPath] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(projectSections.map((project) => [project.path, true])),
  );
  const [isCollapseStateBootstrapped, setIsCollapseStateBootstrapped] = useState(false);
  const hasUserToggledProjectsRef = useRef(false);

  const workspaceData = useMemo(() => buildMockWorkspaceData(locale, projectSections), [locale, projectSections]);

  useEffect(() => {
    setExpandedProjectsByPath((current) => {
      const next = Object.fromEntries(projectSections.map((project) => [project.path, current[project.path] ?? true]));
      const hasChanged =
        Object.keys(current).length !== Object.keys(next).length ||
        projectSections.some((project) => current[project.path] !== next[project.path]);

      return hasChanged ? next : current;
    });
  }, [projectSections]);

  useEffect(() => {
    if (!isDatabaseReady || isCollapseStateBootstrapped) {
      return;
    }

    let active = true;

    const bootstrapCollapsedProjects = async () => {
      try {
        const savedValue = await getMeta(WORKSPACE_COLLAPSED_PROJECTS_META_KEY);

        if (!active) {
          return;
        }

        if (!hasUserToggledProjectsRef.current) {
          const collapsedProjectPaths = new Set(parseCollapsedProjectPaths(savedValue));

          setExpandedProjectsByPath(() =>
            Object.fromEntries(projectSections.map((project) => [project.path, !collapsedProjectPaths.has(project.path)])),
          );
        }

        setIsCollapseStateBootstrapped(true);
      } catch (error) {
        useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
      }
    };

    void bootstrapCollapsedProjects();

    return () => {
      active = false;
    };
  }, [isCollapseStateBootstrapped, isDatabaseReady, projectSections]);

  useEffect(() => {
    if (!isDatabaseReady || !isCollapseStateBootstrapped) {
      return;
    }

    const collapsedProjectPaths = projectSections
      .filter((project) => expandedProjectsByPath[project.path] === false)
      .map((project) => project.path);

    void setMeta(WORKSPACE_COLLAPSED_PROJECTS_META_KEY, JSON.stringify(collapsedProjectPaths)).catch((error) => {
      useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
    });
  }, [expandedProjectsByPath, isCollapseStateBootstrapped, isDatabaseReady, projectSections]);

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
            expandedProjectsByPath={expandedProjectsByPath}
            locale={locale}
            onSelectThread={(projectPath, thread) => {
              useWorkspaceStore.getState().setSelectedProjectPath(projectPath);
              useWorkspaceStore.getState().setSelectedThreadId(thread.id);
            }}
            onToggleProject={(projectPath) => {
              hasUserToggledProjectsRef.current = true;
              setExpandedProjectsByPath((current) => ({
                ...current,
                [projectPath]: !(current[projectPath] ?? true),
              }));
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
