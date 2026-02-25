import type { RecentProject } from "../../lib/persistence/projectRepository";
import { formatRelativeOpenedAt } from "../../lib/time/formatRelativeOpenedAt";

interface StartupScreenProps {
  isLoading: boolean;
  isOpeningProject: boolean;
  recentProjects: RecentProject[];
  errorMessage: string;
  onOpenProject: () => Promise<void>;
  onSelectRecentProject: (project: RecentProject) => Promise<void>;
}

export function StartupScreen(props: StartupScreenProps) {
  return (
    <main className="startup-root">
      <section className="startup-panel">
        <header className="startup-top-row">
          <h1 className="startup-title">Recent Projects</h1>
          <button className="primary-button" disabled={props.isOpeningProject} onClick={props.onOpenProject} type="button">
            {props.isOpeningProject ? "Opening..." : "Open Project"}
          </button>
        </header>

        <section className="recent-section" aria-label="Recent Projects">
          <div className="recent-heading-row">
            <p className="recent-limit">{props.recentProjects.length}/5</p>
          </div>

          {props.isLoading ? <p className="muted-text">Loading recent projects...</p> : null}

          {!props.isLoading && props.recentProjects.length === 0 ? (
            <p className="muted-text">No recent projects yet.</p>
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
                  <span className="recent-time">{formatRelativeOpenedAt(project.openedAt)}</span>
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
