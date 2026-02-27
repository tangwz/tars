import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceStore } from "../../src/stores/workspaceStore";

describe("workspaceStore", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      currentProjectPath: null,
      recentProjects: [],
      selectedProjectPath: null,
      selectedThreadId: null,
      isDatabaseReady: false,
    });
  });

  it("updates current project and recent projects", () => {
    useWorkspaceStore.getState().setCurrentProjectPath("/tmp/a");
    useWorkspaceStore.getState().setRecentProjects([{ path: "/tmp/a", name: "a", openedAt: 1 }]);

    expect(useWorkspaceStore.getState().currentProjectPath).toBe("/tmp/a");
    expect(useWorkspaceStore.getState().recentProjects).toHaveLength(1);
  });

  it("tracks selected project and thread", () => {
    useWorkspaceStore.getState().setSelectedProjectPath("/tmp/a");
    useWorkspaceStore.getState().setSelectedThreadId("thread-1");

    expect(useWorkspaceStore.getState().selectedProjectPath).toBe("/tmp/a");
    expect(useWorkspaceStore.getState().selectedThreadId).toBe("thread-1");
  });
});

