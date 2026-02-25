import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "../../src/lib/store/appStore";

const mocks = vi.hoisted(() => ({
  initializeProjectDatabase: vi.fn(),
  listRecentProjects: vi.fn(),
  upsertRecentProject: vi.fn(),
  removeRecentProject: vi.fn(),
  setMeta: vi.fn(),
  openProjectDirectory: vi.fn(),
  directoryExists: vi.fn(),
}));

vi.mock("../../src/lib/persistence/projectRepository", () => ({
  initializeProjectDatabase: mocks.initializeProjectDatabase,
  listRecentProjects: mocks.listRecentProjects,
  upsertRecentProject: mocks.upsertRecentProject,
  removeRecentProject: mocks.removeRecentProject,
  setMeta: mocks.setMeta,
}));

vi.mock("../../src/lib/tauri/dialogClient", () => ({
  openProjectDirectory: mocks.openProjectDirectory,
}));

vi.mock("../../src/lib/tauri/fsClient", () => ({
  directoryExists: mocks.directoryExists,
}));

import App from "../../src/App";

describe("startupFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.initializeProjectDatabase.mockResolvedValue(undefined);
    mocks.listRecentProjects.mockResolvedValue([]);
    mocks.upsertRecentProject.mockResolvedValue(undefined);
    mocks.removeRecentProject.mockResolvedValue(undefined);
    mocks.setMeta.mockResolvedValue(undefined);
    mocks.openProjectDirectory.mockResolvedValue(null);
    mocks.directoryExists.mockResolvedValue(true);

    useAppStore.getState().setTheme("light");
    useAppStore.getState().setCurrentProject(null);
    useAppStore.getState().setStartupError("");
    document.documentElement.classList.remove("dark-theme");
  });

  it("renders startup screen with open and recent sections", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: /recent projects/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /^open project$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /theme:/i })).not.toBeInTheDocument();
  });

  it("opens project from picker and enters workspace", async () => {
    mocks.openProjectDirectory.mockResolvedValue("/tmp/workspace-alpha");
    mocks.directoryExists.mockResolvedValue(true);

    render(<App />);

    const openButton = await screen.findByRole("button", { name: /^open project$/i });
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(mocks.upsertRecentProject).toHaveBeenCalledWith({
        path: "/tmp/workspace-alpha",
        name: "workspace-alpha",
      });
    });

    expect(mocks.setMeta).toHaveBeenCalledWith("last_project_path", "/tmp/workspace-alpha");
    expect(await screen.findByText("Workspace placeholder. Project tools will be added here.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /theme:/i })).not.toBeInTheDocument();
  });

  it("removes invalid recent project and shows error", async () => {
    mocks.listRecentProjects
      .mockResolvedValueOnce([{ path: "/tmp/missing", name: "missing", openedAt: 10 }])
      .mockResolvedValueOnce([]);
    mocks.directoryExists.mockResolvedValue(false);

    render(<App />);

    const recentButton = await screen.findByRole("button", { name: /missing/i });
    fireEvent.click(recentButton);

    await waitFor(() => {
      expect(mocks.removeRecentProject).toHaveBeenCalledWith("/tmp/missing");
    });

    expect(await screen.findByText("Project path is no longer available.")).toBeInTheDocument();
  });

  it("opens valid recent project and enters workspace", async () => {
    const now = Date.now();
    mocks.listRecentProjects.mockResolvedValue([{ path: "/tmp/repo-beta", name: "repo-beta", openedAt: now - 60_000 }]);
    mocks.directoryExists.mockResolvedValue(true);

    render(<App />);

    const recentButton = await screen.findByRole("button", { name: /repo-beta/i });
    expect(screen.getByText("1m ago")).toBeInTheDocument();
    expect(recentButton).toHaveAttribute("title", "/tmp/repo-beta");
    expect(screen.queryByText("/tmp/repo-beta")).not.toBeInTheDocument();

    fireEvent.click(recentButton);

    await waitFor(() => {
      expect(mocks.upsertRecentProject).toHaveBeenCalledWith({
        path: "/tmp/repo-beta",
        name: "repo-beta",
      });
    });

    expect(await screen.findByText("Workspace placeholder. Project tools will be added here.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /theme:/i })).not.toBeInTheDocument();
  });
});
