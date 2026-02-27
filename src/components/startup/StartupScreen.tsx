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
        <header className="startup-top-row">
          <h1 className="startup-title">{t(locale, "startup.recentProjects")}</h1>
          <button className="primary-button" disabled={props.isOpeningProject} onClick={props.onOpenProject} type="button">
            <span className="primary-button-content">
              <FolderPlus className="button-icon" />
              <span>{props.isOpeningProject ? t(locale, "startup.openingProject") : t(locale, "startup.openProject")}</span>
            </span>
          </button>
        </header>

        <section aria-label={t(locale, "startup.recentProjects")} className="recent-section">
          <div className="recent-heading-row">
            <p className="recent-limit">{t(locale, "startup.recentLimit", { count: props.recentProjects.length })}</p>
          </div>

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

