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
import type { ThreadTitleKey, WorkspaceThread } from "@/components/workspace/ThreadList";

interface WorkspaceShellProps {
  currentProjectPath: string;
  recentProjects: RecentProject[];
  isAddingProject: boolean;
  onAddProject: () => Promise<void>;
}

const THREAD_TITLE_KEYS: ThreadTitleKey[] = [
  "workspace.mockThread.fixDirectoryValidation",
  "workspace.mockThread.initTauriStack",
  "workspace.mockThread.planMvpTasks",
  "workspace.mockThread.refactorMapView",
  "workspace.mockThread.settingsSimplification",
  "workspace.mockThread.releasePlan",
];

const THREAD_TIME_OFFSETS = [
  12 * 60 * 1000,
  18 * 60 * 60 * 1000,
  5 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
] as const;

function getProjectName(path: string): string {
  const normalized = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return normalized[normalized.length - 1] ?? path;
}

function hashPath(path: string): number {
  let hash = 0;

  for (let index = 0; index < path.length; index += 1) {
    hash = (hash * 31 + path.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function buildMockThreads(projectPath: string): WorkspaceThread[] {
  const hash = hashPath(projectPath);
  const threadCount = 3 + (hash % 3);
  const now = Date.now();

  return Array.from({ length: threadCount }, (_, index) => {
    const titleKey = THREAD_TITLE_KEYS[(hash + index) % THREAD_TITLE_KEYS.length];
    const offset = THREAD_TIME_OFFSETS[(hash + index) % THREAD_TIME_OFFSETS.length];

    return {
      id: `${projectPath}::thread-${index + 1}`,
      titleKey,
      openedAt: now - offset,
    };
  });
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

  const threadsByProject = useMemo<Record<string, WorkspaceThread[]>>(() => {
    return Object.fromEntries(projectSections.map((project) => [project.path, buildMockThreads(project.path)]));
  }, [projectSections]);

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
    () => (selectedProjectPath ? threadsByProject[selectedProjectPath] ?? [] : []),
    [selectedProjectPath, threadsByProject],
  );

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
            threadsByProject={threadsByProject}
          />
        </div>

        <footer className="workspace-sidebar-footer">
          <SettingsMenu
            isOpen={isSettingsOpen}
            locale={locale}
            onSelectLocale={(nextLocale) => {
              useLocaleStore.getState().setLocale(nextLocale);
              useUIStore.getState().setIsSettingsOpen(false);
            }}
            onToggle={() => {
              useUIStore.getState().setIsSettingsOpen(!useUIStore.getState().isSettingsOpen);
            }}
          />
        </footer>
      </aside>

      <section aria-label={t(locale, "workspace.mainPanelAria")} className="workspace-main">
        <div className="workspace-main-placeholder">
          <p>{t(locale, "workspace.mainPlaceholder")}</p>
        </div>
      </section>
    </main>
  );
}
