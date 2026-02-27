import { Folder } from "lucide-react";
import type { RecentProject } from "@/services/persistence/projectRepository";
import type { Locale } from "@/i18n/types";
import { ThreadList, type WorkspaceThread } from "@/components/workspace/ThreadList";

interface ProjectListProps {
  locale: Locale;
  projects: RecentProject[];
  threadsByProject: Record<string, WorkspaceThread[]>;
  selectedThreadId: string | null;
  onSelectThread: (projectPath: string, thread: WorkspaceThread) => void;
}

export function ProjectList(props: ProjectListProps) {
  return (
    <>
      {props.projects.map((project) => (
        <section className="workspace-project-group" key={project.path}>
          <h2 className="workspace-project-name">
            <Folder className="workspace-project-icon" />
            <span className="workspace-project-name-text">{project.name}</span>
          </h2>
          <ThreadList
            locale={props.locale}
            onSelect={(thread) => {
              props.onSelectThread(project.path, thread);
            }}
            selectedThreadId={props.selectedThreadId}
            threads={props.threadsByProject[project.path] ?? []}
          />
        </section>
      ))}
    </>
  );
}

