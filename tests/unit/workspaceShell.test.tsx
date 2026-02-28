import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceShell } from "../../src/components/workspace/WorkspaceShell";
import { useLocaleStore } from "../../src/stores/localeStore";
import { useUIStore } from "../../src/stores/uiStore";
import { useWorkspaceStore } from "../../src/stores/workspaceStore";
import type { RecentProject } from "../../src/services/persistence/projectRepository";

const recentProjects: RecentProject[] = [
  {
    path: "/tmp/tars",
    name: "tars",
    openedAt: Date.now() - 5_000,
  },
  {
    path: "/tmp/corobase",
    name: "corobase",
    openedAt: Date.now() - 30_000,
  },
];

describe("WorkspaceShell", () => {
  const onAddProject = vi.fn(async () => undefined);
  const onOpenSettings = vi.fn();

  beforeEach(() => {
    onAddProject.mockClear();
    onOpenSettings.mockClear();
    useLocaleStore.setState({ locale: "en", isLocaleBootstrapped: true });
    useUIStore.setState({
      theme: "light",
      startupError: "",
      isLoadingRecent: false,
      isOpeningProject: false,
      isSettingsOpen: false,
    });
    useWorkspaceStore.setState({
      currentProjectPath: "/tmp/tars",
      recentProjects,
      selectedProjectPath: null,
      selectedThreadId: null,
      isDatabaseReady: true,
    });
  });

  it(
    "renders project groups and threads",
    () => {
      render(
        <WorkspaceShell
          currentProjectPath="/tmp/tars"
          isAddingProject={false}
          onAddProject={onAddProject}
          onOpenSettings={onOpenSettings}
          recentProjects={recentProjects}
        />,
      );

      expect(screen.getByText("Threads")).toBeInTheDocument();
      expect(screen.getByText("tars")).toBeInTheDocument();
      expect(screen.getByText("corobase")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByLabelText("Add project")).toBeInTheDocument();
    },
    20_000,
  );

  it("updates active thread style on click", () => {
    const { container } = render(
      <WorkspaceShell
        currentProjectPath="/tmp/tars"
        isAddingProject={false}
        onAddProject={onAddProject}
        onOpenSettings={onOpenSettings}
        recentProjects={recentProjects}
      />,
    );
    const threadButtons = Array.from(container.querySelectorAll<HTMLButtonElement>(".workspace-thread-item"));
    expect(threadButtons.length).toBeGreaterThan(1);

    fireEvent.click(threadButtons[1]);

    expect(threadButtons[1]).toHaveClass("is-active");
  });

  it("opens settings from the footer menu", () => {
    render(
      <WorkspaceShell
        currentProjectPath="/tmp/tars"
        isAddingProject={false}
        onAddProject={onAddProject}
        onOpenSettings={onOpenSettings}
        recentProjects={recentProjects}
      />,
    );

    fireEvent.click(screen.getByText("Settings"));
    fireEvent.click(screen.getAllByText("Settings")[1]);

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it(
    "triggers add project callback from header action",
    () => {
      render(
        <WorkspaceShell
          currentProjectPath="/tmp/tars"
          isAddingProject={false}
          onAddProject={onAddProject}
          onOpenSettings={onOpenSettings}
          recentProjects={recentProjects}
        />,
      );

      fireEvent.click(screen.getByLabelText("Add project"));
      expect(onAddProject).toHaveBeenCalledTimes(1);
    },
    20_000,
  );
});
