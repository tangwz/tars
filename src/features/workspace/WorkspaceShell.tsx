interface WorkspaceShellProps {
  currentProjectPath: string;
  onBackToStartup: () => void;
}

function getProjectName(path: string): string {
  const normalized = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return normalized[normalized.length - 1] ?? path;
}

export function WorkspaceShell(props: WorkspaceShellProps) {
  const projectName = getProjectName(props.currentProjectPath);

  return (
    <main className="workspace-root">
      <div className="workspace-header">
        <div>
          <p className="workspace-kicker">Active Project</p>
          <h1 className="workspace-title">{projectName}</h1>
          <p className="workspace-path">{props.currentProjectPath}</p>
        </div>
        <div className="workspace-actions">
          <button className="primary-button" onClick={props.onBackToStartup} type="button">
            Back to Startup
          </button>
        </div>
      </div>
      <section className="workspace-placeholder">
        <p>Workspace placeholder. Project tools will be added here.</p>
      </section>
    </main>
  );
}
