import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { t } from "../../src/lib/i18n/translate";
import { useLocaleStore } from "../../src/stores/localeStore";
import { useUIStore } from "../../src/stores/uiStore";
import { useWorkspaceStore } from "../../src/stores/workspaceStore";

const mocks = vi.hoisted(() => ({
  initializeProjectDatabase: vi.fn(),
  listRecentProjects: vi.fn(),
  upsertRecentProject: vi.fn(),
  removeRecentProject: vi.fn(),
  setMeta: vi.fn(),
  getMeta: vi.fn(),
  openProjectDirectory: vi.fn(),
  directoryExists: vi.fn(),
}));

vi.mock("@/services/persistence/projectRepository", () => ({
  initializeProjectDatabase: mocks.initializeProjectDatabase,
  listRecentProjects: mocks.listRecentProjects,
  upsertRecentProject: mocks.upsertRecentProject,
  removeRecentProject: mocks.removeRecentProject,
  setMeta: mocks.setMeta,
  getMeta: mocks.getMeta,
}));

vi.mock("@/services/tauri/dialogClient", () => ({
  openProjectDirectory: mocks.openProjectDirectory,
}));

vi.mock("@/services/tauri/fsClient", () => ({
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
    mocks.getMeta.mockResolvedValue(null);
    mocks.openProjectDirectory.mockResolvedValue(null);
    mocks.directoryExists.mockResolvedValue(true);

    useUIStore.setState({
      theme: "light",
      startupError: "",
      isLoadingRecent: true,
      isOpeningProject: false,
      isSettingsOpen: false,
    });
    useLocaleStore.setState({ locale: "en", isLocaleBootstrapped: false });
    useWorkspaceStore.setState({
      currentProjectPath: null,
      recentProjects: [],
      selectedProjectPath: null,
      selectedThreadId: null,
      isDatabaseReady: false,
    });
    document.documentElement.classList.remove("dark-theme");
  });

  it(
    "renders startup screen with open and recent sections",
    async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

      expect(await screen.findByRole("heading", { name: t("en", "startup.recentProjects") })).toBeInTheDocument();
      expect(await screen.findByRole("button", { name: t("en", "startup.openProject") })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /theme:/i })).not.toBeInTheDocument();
    },
    10_000,
  );

  it(
    "opens project from picker and enters workspace",
    async () => {
      mocks.openProjectDirectory.mockResolvedValue("/tmp/workspace-alpha");
      mocks.directoryExists.mockResolvedValue(true);

      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

      const openButton = await screen.findByRole("button", { name: t("en", "startup.openProject") });
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(mocks.upsertRecentProject).toHaveBeenCalledWith({
          path: "/tmp/workspace-alpha",
          name: "workspace-alpha",
        });
      });

      expect(mocks.setMeta).toHaveBeenCalledWith("last_project_path", "/tmp/workspace-alpha");
      await waitFor(
        () => {
          expect(screen.getByText(t("en", "workspace.thread.startBuilding"))).toBeInTheDocument();
        },
        { timeout: 15_000 },
      );
      expect(screen.queryByRole("button", { name: /theme:/i })).not.toBeInTheDocument();
    },
    20_000,
  );

  it("removes invalid recent project and shows error", async () => {
    mocks.listRecentProjects
      .mockResolvedValueOnce([{ path: "/tmp/missing", name: "missing", openedAt: 10 }])
      .mockResolvedValueOnce([]);
    mocks.directoryExists.mockResolvedValue(false);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const recentButton = await screen.findByRole("button", { name: /missing/i });
    fireEvent.click(recentButton);

    await waitFor(() => {
      expect(mocks.removeRecentProject).toHaveBeenCalledWith("/tmp/missing");
    });

    expect(await screen.findByText(t("en", "error.projectPathUnavailable"))).toBeInTheDocument();
  });

  it(
    "opens valid recent project and enters workspace",
    async () => {
      const now = Date.now();
      mocks.listRecentProjects.mockResolvedValue([{ path: "/tmp/repo-beta", name: "repo-beta", openedAt: now - 60_000 }]);
      mocks.directoryExists.mockResolvedValue(true);

      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

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

      await waitFor(
        () => {
          expect(screen.getByText(t("en", "workspace.thread.startBuilding"))).toBeInTheDocument();
        },
        { timeout: 15_000 },
      );
      expect(screen.queryByRole("button", { name: /theme:/i })).not.toBeInTheDocument();
    },
    20_000,
  );
});
