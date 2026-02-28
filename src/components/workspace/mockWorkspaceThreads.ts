import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import type { RecentProject } from "@/services/persistence/projectRepository";

export interface WorkspaceThreadSummary {
  id: string;
  title: string;
  openedAt: number;
}

export interface ThreadHeaderState {
  openTarget: "vscode" | "default";
  approvalMode: "submit" | "auto" | "review";
  usagePositive: number;
  usageNegative: number;
}

export interface ThreadComposerPreset {
  draft: string;
  model: "GPT-5.3-Codex" | "GPT-5.3" | "GPT-4.1";
  effort: "low" | "medium" | "high";
  mode: "plan" | "chat";
}

export interface ThreadStatusMeta {
  workspaceKind: "local";
  accessLevel: "read-only" | "workspace-write" | "full-access";
  branchName: string;
}

export interface WorkspaceThreadDetail {
  id: string;
  title: string;
  projectName: string;
  header: ThreadHeaderState;
  composer: ThreadComposerPreset;
  statusBar: ThreadStatusMeta;
}

interface MockWorkspaceData {
  detailsById: Record<string, WorkspaceThreadDetail>;
  threadsByProject: Record<string, WorkspaceThreadSummary[]>;
}

const THREAD_TIME_OFFSETS = [
  12 * 60 * 1000,
  18 * 60 * 60 * 1000,
  5 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
] as const;

const THREAD_KEY_GROUPS = [
  [
    "workspace.thread.newThread" as const,
    "workspace.mockThread.planMvpTasks" as const,
    "workspace.mockThread.releasePlan" as const,
  ],
  [
    "workspace.thread.newThread" as const,
    "workspace.mockThread.refactorMapView" as const,
    "workspace.mockThread.settingsSimplification" as const,
  ],
  [
    "workspace.thread.newThread" as const,
    "workspace.mockThread.fixDirectoryValidation" as const,
    "workspace.mockThread.initTauriStack" as const,
  ],
] as const;

export function buildMockWorkspaceData(locale: Locale, projects: RecentProject[]): MockWorkspaceData {
  const detailsById: Record<string, WorkspaceThreadDetail> = {};
  const threadsByProject = Object.fromEntries(
    projects.map((project, projectIndex) => {
      const titleKeys = THREAD_KEY_GROUPS[projectIndex % THREAD_KEY_GROUPS.length];
      const threads = titleKeys.map((titleKey, threadIndex) => {
        const id = `${project.path}::thread-${threadIndex + 1}`;
        const title = t(locale, titleKey);
        const openedAt = Date.now() - THREAD_TIME_OFFSETS[(projectIndex + threadIndex) % THREAD_TIME_OFFSETS.length];

        detailsById[id] = {
          composer: {
            draft: "",
            effort: threadIndex === 2 ? "medium" : "high",
            mode: threadIndex === 2 ? "chat" : "plan",
            model: threadIndex === 1 ? "GPT-5.3" : "GPT-5.3-Codex",
          },
          header: {
            approvalMode: threadIndex === 2 ? "review" : "submit",
            openTarget: "vscode",
            usageNegative: 34 + projectIndex * 17 + threadIndex * 9,
            usagePositive: 412 + projectIndex * 103 + threadIndex * 58,
          },
          id,
          projectName: project.name,
          statusBar: {
            accessLevel: threadIndex === 2 ? "workspace-write" : "full-access",
            branchName: projectIndex === 0 ? "main" : `feature/${project.name}`,
            workspaceKind: "local",
          },
          title,
        };

        return {
          id,
          openedAt,
          title,
        };
      });

      return [project.path, threads];
    }),
  );

  return {
    detailsById,
    threadsByProject,
  };
}
