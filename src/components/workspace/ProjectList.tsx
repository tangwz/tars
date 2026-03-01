import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import type { RecentProject } from "@/services/persistence/projectRepository";
import type { Locale } from "@/i18n/types";
import { ThreadList, type WorkspaceThreadSummary } from "@/components/workspace/ThreadList";

interface ProjectListProps {
  expandedProjectsByPath: Record<string, boolean>;
  locale: Locale;
  onToggleProject: (projectPath: string) => void;
  projects: RecentProject[];
  threadsByProject: Record<string, WorkspaceThreadSummary[]>;
  selectedThreadId: string | null;
  onSelectThread: (projectPath: string, thread: WorkspaceThreadSummary) => void;
}

export function ProjectList(props: ProjectListProps) {
  return (
    <>
      {props.projects.map((project) => (
        <section className="workspace-project-group" key={project.path}>
          {(() => {
            const isExpanded = props.expandedProjectsByPath[project.path] ?? true;
            const threadListId = `workspace-project-threads-${project.path.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
            const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

            return (
              <>
                <h2 className="workspace-project-heading">
                  <button
                    aria-controls={threadListId}
                    aria-expanded={isExpanded}
                    className="workspace-project-toggle"
                    onClick={() => {
                      props.onToggleProject(project.path);
                    }}
                    type="button"
                  >
                    <span className="workspace-project-toggle-main">
                      <Folder className="workspace-project-icon" />
                      <span className="workspace-project-name-text">{project.name}</span>
                    </span>
                    <ChevronIcon className="workspace-project-chevron" />
                  </button>
                </h2>
                {isExpanded ? (
                  <div className="workspace-project-threads" id={threadListId}>
                    <ThreadList
                      locale={props.locale}
                      onSelect={(thread) => {
                        props.onSelectThread(project.path, thread);
                      }}
                      selectedThreadId={props.selectedThreadId}
                      threads={props.threadsByProject[project.path] ?? []}
                    />
                  </div>
                ) : null}
              </>
            );
          })()}
        </section>
      ))}
    </>
  );
}
