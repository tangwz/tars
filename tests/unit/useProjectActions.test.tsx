import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocaleStore } from "../../src/stores/localeStore";
import { useUIStore } from "../../src/stores/uiStore";
import { useWorkspaceStore } from "../../src/stores/workspaceStore";

const mocks = vi.hoisted(() => ({
  listRecentProjects: vi.fn(),
  removeRecentProject: vi.fn(),
  setMeta: vi.fn(),
  upsertRecentProject: vi.fn(),
  openProjectDirectory: vi.fn(),
  directoryExists: vi.fn(),
}));

vi.mock("@/services/persistence/projectRepository", () => ({
  listRecentProjects: mocks.listRecentProjects,
  removeRecentProject: mocks.removeRecentProject,
  setMeta: mocks.setMeta,
  upsertRecentProject: mocks.upsertRecentProject,
}));

vi.mock("@/services/tauri/dialogClient", () => ({
  openProjectDirectory: mocks.openProjectDirectory,
}));

vi.mock("@/services/tauri/fsClient", () => ({
  directoryExists: mocks.directoryExists,
}));

import { useProjectActions } from "../../src/hooks/useProjectActions";

describe("useProjectActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listRecentProjects.mockResolvedValue([]);
    mocks.removeRecentProject.mockResolvedValue(undefined);
    mocks.setMeta.mockResolvedValue(undefined);
    mocks.upsertRecentProject.mockResolvedValue(undefined);
    mocks.openProjectDirectory.mockResolvedValue(null);
    mocks.directoryExists.mockResolvedValue(true);

    useLocaleStore.setState({ locale: "en", isLocaleBootstrapped: true });
    useUIStore.setState({
      theme: "light",
      startupError: "",
      isLoadingRecent: false,
      isOpeningProject: false,
      isSettingsOpen: false,
    });
    useWorkspaceStore.setState({
      currentProjectPath: null,
      recentProjects: [],
      selectedProjectPath: null,
      selectedThreadId: null,
      isDatabaseReady: true,
    });
  });

  it("opens a valid project and updates workspace state", async () => {
    const { result } = renderHook(() => useProjectActions(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    await act(async () => {
      await result.current.openProject("/tmp/workspace-alpha");
    });

    expect(mocks.upsertRecentProject).toHaveBeenCalledWith({
      path: "/tmp/workspace-alpha",
      name: "workspace-alpha",
    });
    expect(mocks.setMeta).toHaveBeenCalledWith("last_project_path", "/tmp/workspace-alpha");
    expect(useWorkspaceStore.getState().currentProjectPath).toBe("/tmp/workspace-alpha");
  });

  it("removes invalid project and sets startup error", async () => {
    mocks.directoryExists.mockResolvedValue(false);

    const { result } = renderHook(() => useProjectActions(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    await act(async () => {
      await result.current.openProject("/tmp/missing");
    });

    expect(mocks.removeRecentProject).toHaveBeenCalledWith("/tmp/missing");
    expect(useUIStore.getState().startupError).toContain("Project path is no longer available");
  });

  it("opens project picker and delegates to openProject", async () => {
    mocks.openProjectDirectory.mockResolvedValue("/tmp/workspace-beta");

    const { result } = renderHook(() => useProjectActions(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    await act(async () => {
      await result.current.openProjectFromDialog();
    });

    expect(mocks.openProjectDirectory).toHaveBeenCalledTimes(1);
    expect(mocks.upsertRecentProject).toHaveBeenCalledWith({
      path: "/tmp/workspace-beta",
      name: "workspace-beta",
    });
  });
});

