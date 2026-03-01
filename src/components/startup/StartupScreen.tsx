import { FolderPlus } from "lucide-react";
import type { RecentProject } from "@/services/persistence/projectRepository";
import { t } from "@/i18n/translate";
import { localeSelectors, useLocaleStore } from "@/stores/localeStore";
import { formatRelativeOpenedAt } from "@/lib/time/formatRelativeOpenedAt";

interface StartupScreenProps {
  isLoading: boolean;
  isOpeningProject: boolean;
  recentProjects: RecentProject[];
  errorMessage: string;
  onOpenProject: () => Promise<void>;
  onSelectRecentProject: (project: RecentProject) => Promise<void>;
}

export function StartupScreen(props: StartupScreenProps) {
  const locale = useLocaleStore(localeSelectors.locale);

  return (
    <main className="startup-root">
      <section className="startup-panel">
        <div className="startup-hero-row">
          <header className="startup-title-region" data-tauri-drag-region>
            <h1 className="startup-title">{t(locale, "startup.recentProjects")}</h1>
          </header>

          <aside className="startup-action-rail">
            <button
              className="primary-button startup-open-button window-no-drag"
              disabled={props.isOpeningProject}
              onClick={props.onOpenProject}
              type="button"
            >
              <span className="primary-button-content startup-open-button-content">
                <FolderPlus className="button-icon" />
                <span className="startup-open-button-label">
                  {props.isOpeningProject ? t(locale, "startup.openingProject") : t(locale, "startup.openProject")}
                </span>
              </span>
            </button>

            <p className="recent-limit">{t(locale, "startup.recentLimit", { count: props.recentProjects.length })}</p>
          </aside>
        </div>

        <section aria-label={t(locale, "startup.recentProjects")} className="recent-section">
          {props.isLoading ? <p className="muted-text">{t(locale, "startup.loadingRecentProjects")}</p> : null}

          {!props.isLoading && props.recentProjects.length === 0 ? (
            <p className="muted-text">{t(locale, "startup.noRecentProjects")}</p>
          ) : null}

          <ul className="recent-list">
            {props.recentProjects.map((project) => (
              <li key={project.path}>
                <button
                  className="recent-item"
                  onClick={() => {
                    void props.onSelectRecentProject(project);
                  }}
                  title={project.path}
                  type="button"
                >
                  <span className="recent-name">{project.name}</span>
                  <span className="recent-time">{formatRelativeOpenedAt(project.openedAt, Date.now(), locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {props.errorMessage ? <p className="error-text">{props.errorMessage}</p> : null}
      </section>
    </main>
  );
}
