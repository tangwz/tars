import { ChevronDown, Sparkles } from "lucide-react";
import { MenuPanel } from "@/components/ui/MenuPanel";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import type { RecentProject } from "@/services/persistence/projectRepository";

export type ThreadEmptyMenuId = "project" | null;

interface ThreadEmptyStateProps {
  locale: Locale;
  onSelectProjectName: (value: string) => void;
  onToggleMenu: (menu: Exclude<ThreadEmptyMenuId, null>) => void;
  openMenu: ThreadEmptyMenuId;
  projectName: string;
  recentProjects: RecentProject[];
}

export function ThreadEmptyState(props: ThreadEmptyStateProps) {
  const { locale, onSelectProjectName, onToggleMenu, openMenu, projectName, recentProjects } = props;

  return (
    <div className="thread-empty-state">
      <div className="thread-empty-state-copy">
        <Sparkles aria-hidden="true" className="thread-empty-state-icon" />
        <h3 className="thread-empty-state-title">{t(locale, "workspace.thread.startBuilding")}</h3>
        <div className="thread-empty-state-project-control">
          <button
            aria-label={projectName}
            aria-expanded={openMenu === "project"}
            aria-haspopup="menu"
            className="thread-empty-state-project-button"
            onClick={() => {
              onToggleMenu("project");
            }}
            type="button"
          >
            <span>{projectName}</span>
            <ChevronDown className="thread-empty-state-project-chevron" />
          </button>

          {openMenu === "project" ? (
            <MenuPanel ariaLabel={t(locale, "workspace.thread.projectMenuAria")} className="thread-empty-state-menu">
              {recentProjects.map((project) => (
                <button
                  className={`thread-panel-menu-item${project.name === projectName ? " is-active" : ""}`}
                  key={project.path}
                  onClick={() => {
                    onSelectProjectName(project.name);
                  }}
                  type="button"
                >
                  {project.name}
                </button>
              ))}
            </MenuPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
