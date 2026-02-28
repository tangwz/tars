import { fireEvent, render, screen } from "@testing-library/react";
import { mockIPC } from "@tauri-apps/api/mocks";
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
    useLocaleStore.setState({ locale: "zh-CN", isLocaleBootstrapped: true });
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
    "renders project groups and the phase one thread panel shell",
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

      expect(screen.getByText("会话")).toBeInTheDocument();
      expect(screen.getByText("tars", { selector: ".workspace-project-name-text" })).toBeInTheDocument();
      expect(screen.getByText("corobase", { selector: ".workspace-project-name-text" })).toBeInTheDocument();
      expect(screen.getByText("设置")).toBeInTheDocument();
      expect(screen.getByText("新线程", { selector: ".thread-panel-title" })).toBeInTheDocument();
      expect(screen.getByText("开始构建")).toBeInTheDocument();
      expect(screen.getByText("完全访问权限")).toBeInTheDocument();
      expect(screen.getByText("GPT-5.3-Codex")).toBeInTheDocument();
      expect(screen.queryByText("右侧工作区暂未设计，后续将在这里展示会话内容。")).not.toBeInTheDocument();
      expect(screen.getByLabelText("添加项目")).toBeInTheDocument();
    },
    20_000,
  );

  it("updates active thread style and the thread panel title on click", () => {
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
    expect(container.querySelector(".thread-panel-title")?.textContent).toBe("规划 MVP 任务与 Agent 流程");
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

    fireEvent.click(screen.getByText("设置"));
    fireEvent.click(screen.getAllByText("设置")[1]);

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it(
    "expands language options in the footer menu and switches locale",
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

      fireEvent.click(screen.getByText("设置"));

      const menu = screen.getByRole("menu", { name: "设置菜单" });
      expect(menu).toBeInTheDocument();
      expect(screen.queryByRole("menuitemradio", { name: "English" })).not.toBeInTheDocument();
      expect(screen.queryByRole("menuitemradio", { name: "简体中文" })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("menuitem", { name: "语言" }));

      const englishOption = screen.getByRole("menuitemradio", { name: "English" });
      const chineseOption = screen.getByRole("menuitemradio", { name: "简体中文" });

      expect(englishOption).toHaveAttribute("aria-checked", "false");
      expect(chineseOption).toHaveAttribute("aria-checked", "true");

      fireEvent.click(englishOption);

      expect(useLocaleStore.getState().locale).toBe("en");
      expect(screen.queryByRole("menu", { name: "Settings menu" })).not.toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Settings"));
      fireEvent.click(screen.getByRole("menuitem", { name: "Language" }));

      const reopenedMenu = screen.getByRole("menu", { name: "Settings menu" });
      expect(reopenedMenu).toBeInTheDocument();

      const reopenedEnglishOption = screen.getByRole("menuitemradio", { name: "English" });
      const reopenedChineseOption = screen.getByRole("menuitemradio", { name: "简体中文" });

      expect(reopenedEnglishOption).toHaveAttribute("aria-checked", "true");
      expect(reopenedChineseOption).toHaveAttribute("aria-checked", "false");

      fireEvent.click(reopenedChineseOption);

      expect(useLocaleStore.getState().locale).toBe("zh-CN");
      expect(screen.queryByRole("menu", { name: "设置菜单" })).not.toBeInTheDocument();
      expect(screen.getByText("设置")).toBeInTheDocument();
    },
    20_000,
  );

  it(
    "switches the right panel dropdown controls",
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

      fireEvent.click(screen.getByRole("button", { name: "打开 VS Code" }));
      fireEvent.click(screen.getByText("默认应用"));
      expect(screen.getByRole("button", { name: "打开 默认应用" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "提交 提交" }));
      fireEvent.click(screen.getByText("自动"));
      expect(screen.getByRole("button", { name: "提交 自动" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /GPT-5.3-Codex/i }));
      fireEvent.click(screen.getByText("GPT-4.1"));
      expect(screen.getByRole("button", { name: /GPT-4.1/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^高$/i }));
      fireEvent.click(screen.getByText("中"));
      expect(screen.getByRole("button", { name: /^中$/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /计划/i }));
      fireEvent.click(screen.getByText("对话"));
      expect(screen.getByRole("button", { name: /对话/i })).toBeInTheDocument();
    },
    30_000,
  );

  it("keeps the send button disabled in phase one", () => {
    render(
      <WorkspaceShell
        currentProjectPath="/tmp/tars"
        isAddingProject={false}
        onAddProject={onAddProject}
        onOpenSettings={onOpenSettings}
        recentProjects={recentProjects}
      />,
    );

    expect(screen.getByLabelText("发送")).toBeDisabled();
  });

  it("copies the thread title through the clipboard client", () => {
    mockIPC((command, payload) => {
      expect(command).toBe("plugin:clipboard-manager|write_text");
      expect(payload).toEqual({ opts: undefined, text: "新线程" });
      return undefined;
    });

    render(
      <WorkspaceShell
        currentProjectPath="/tmp/tars"
        isAddingProject={false}
        onAddProject={onAddProject}
        onOpenSettings={onOpenSettings}
        recentProjects={recentProjects}
      />,
    );

    fireEvent.click(screen.getByLabelText("复制线程标题"));
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

      fireEvent.click(screen.getByLabelText("添加项目"));
      expect(onAddProject).toHaveBeenCalledTimes(1);
    },
    20_000,
  );
});
