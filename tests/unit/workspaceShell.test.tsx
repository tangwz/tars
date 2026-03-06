import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { mockIPC } from "@tauri-apps/api/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RuntimeSelectionModal } from "../../src/components/runtime/RuntimeSelectionModal";
import { WorkspaceShell } from "../../src/components/workspace/WorkspaceShell";
import type { RecentProject } from "../../src/services/persistence/projectRepository";
import { useLocaleStore } from "../../src/stores/localeStore";
import { useRuntimeStore } from "../../src/stores/runtimeStore";
import { useUIStore } from "../../src/stores/uiStore";
import { useWorkspaceStore } from "../../src/stores/workspaceStore";

const mocks = vi.hoisted(() => ({
  getMeta: vi.fn(),
  setMeta: vi.fn(),
}));

vi.mock("@/services/persistence/projectRepository", async () => {
  const actual = await vi.importActual<typeof import("@/services/persistence/projectRepository")>(
    "@/services/persistence/projectRepository",
  );

  return {
    ...actual,
    getMeta: mocks.getMeta,
    setMeta: mocks.setMeta,
  };
});

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

  function renderWorkspaceShell(projects = recentProjects) {
    return render(
      <>
        <WorkspaceShell
          currentProjectPath="/tmp/tars"
          isAddingProject={false}
          onAddProject={onAddProject}
          onOpenSettings={onOpenSettings}
          recentProjects={projects}
        />
        <RuntimeSelectionModal />
      </>,
    );
  }

  function getProjectToggle(container: HTMLElement, projectName: string): HTMLButtonElement {
    const toggle = Array.from(container.querySelectorAll<HTMLButtonElement>(".workspace-project-toggle")).find((button) =>
      button.textContent?.includes(projectName),
    );

    if (!toggle) {
      throw new Error(`Missing project toggle for ${projectName}`);
    }

    return toggle;
  }

  beforeEach(() => {
    onAddProject.mockClear();
    onOpenSettings.mockClear();
    mocks.getMeta.mockResolvedValue(null);
    mocks.setMeta.mockResolvedValue(undefined);
    useLocaleStore.setState({ locale: "zh-CN", isLocaleBootstrapped: true });
    useUIStore.setState({
      theme: "light",
      startupError: "",
      isLoadingRecent: false,
      isOpeningProject: false,
      isSettingsOpen: false,
      runtimeModal: {
        isOpen: false,
        threadId: null,
        selectedRuntimeId: null,
        filter: "all",
        isVerifying: false,
        errorMessage: "",
        oauthPendingSessionId: null,
      },
    });
    useRuntimeStore.setState({
      isRuntimeBootstrapped: true,
      defaultRuntimeId: null,
      authMetadataById: {},
      runtimeAuthAvailabilityById: {},
    });
    useWorkspaceStore.setState({
      currentProjectPath: "/tmp/tars",
      recentProjects,
      selectedProjectPath: null,
      selectedThreadId: null,
      isDatabaseReady: true,
      threadRuntimeOverridesById: {},
    });
  });

  it(
    "renders project groups and the phase one thread panel shell",
    () => {
      const { container } = renderWorkspaceShell();

      expect(screen.getByText("会话")).toBeInTheDocument();
      expect(screen.getByText("tars", { selector: ".workspace-project-name-text" })).toBeInTheDocument();
      expect(screen.getByText("corobase", { selector: ".workspace-project-name-text" })).toBeInTheDocument();
      expect(screen.getByText("设置")).toBeInTheDocument();
      expect(screen.getByText("新线程", { selector: ".thread-panel-title" })).toBeInTheDocument();
      expect(screen.getByText("开始构建")).toBeInTheDocument();
      expect(screen.getByText("完全访问权限")).toBeInTheDocument();
      expect(screen.getByText("Codex")).toBeInTheDocument();
      expect(screen.queryByText("右侧工作区暂未设计，后续将在这里展示会话内容。")).not.toBeInTheDocument();
      expect(screen.getByLabelText("添加项目")).toBeInTheDocument();
      expect(container.querySelector(".workspace-sidebar-titlebar")).toHaveAttribute("data-tauri-drag-region");
      expect(container.querySelector(".workspace-sidebar-header")).not.toHaveAttribute("data-tauri-drag-region");
      expect(container.querySelector(".thread-panel-header")).toHaveAttribute("data-tauri-drag-region");
      expect(container.querySelector(".thread-panel-actions")).toHaveClass("window-no-drag");
    },
    20_000,
  );

  it("expands all project groups by default", () => {
    const { container } = renderWorkspaceShell();

    expect(getProjectToggle(container, "tars")).toHaveAttribute("aria-expanded", "true");
    expect(getProjectToggle(container, "corobase")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("规划 MVP 任务与 Agent 流程")).toBeInTheDocument();
    expect(screen.getByText("实现地图渲染重构方案")).toBeInTheDocument();
  });

  it("collapses and re-expands a project's thread list", () => {
    const { container } = renderWorkspaceShell();

    const corobaseToggle = getProjectToggle(container, "corobase");

    fireEvent.click(corobaseToggle);

    expect(corobaseToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("实现地图渲染重构方案")).not.toBeInTheDocument();
    expect(screen.getByText("规划 MVP 任务与 Agent 流程")).toBeInTheDocument();

    fireEvent.click(corobaseToggle);

    expect(corobaseToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("实现地图渲染重构方案")).toBeInTheDocument();
  });

  it("restores persisted collapsed project groups from app meta", async () => {
    mocks.getMeta.mockResolvedValueOnce(JSON.stringify(["/tmp/corobase"]));

    const { container } = renderWorkspaceShell();

    await waitFor(() => {
      expect(getProjectToggle(container, "corobase")).toHaveAttribute("aria-expanded", "false");
    });

    expect(screen.queryByText("实现地图渲染重构方案")).not.toBeInTheDocument();
    expect(getProjectToggle(container, "tars")).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the right panel detail when collapsing the selected project's thread list", () => {
    const { container } = renderWorkspaceShell();

    fireEvent.click(screen.getByText("简化目标设置区域布局"));
    expect(screen.getByText("简化目标设置区域布局", { selector: ".thread-panel-title" })).toBeInTheDocument();

    fireEvent.click(getProjectToggle(container, "corobase"));

    expect(screen.queryByText("实现地图渲染重构方案")).not.toBeInTheDocument();
    expect(screen.getByText("简化目标设置区域布局", { selector: ".thread-panel-title" })).toBeInTheDocument();
  });

  it("defaults newly added projects to expanded on rerender", () => {
    const { container, rerender } = renderWorkspaceShell();

    fireEvent.click(getProjectToggle(container, "corobase"));
    expect(getProjectToggle(container, "corobase")).toHaveAttribute("aria-expanded", "false");

    const nextProjects: RecentProject[] = [
      ...recentProjects,
      {
        path: "/tmp/craft",
        name: "craft",
        openedAt: Date.now() - 60_000,
      },
    ];

    rerender(
      <>
        <WorkspaceShell
          currentProjectPath="/tmp/tars"
          isAddingProject={false}
          onAddProject={onAddProject}
          onOpenSettings={onOpenSettings}
          recentProjects={nextProjects}
        />
        <RuntimeSelectionModal />
      </>,
    );

    expect(getProjectToggle(container, "corobase")).toHaveAttribute("aria-expanded", "false");
    expect(getProjectToggle(container, "craft")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("修复项目目录校验问题")).toBeInTheDocument();
  });

  it("persists collapsed project paths when toggled", async () => {
    const { container } = renderWorkspaceShell();

    await waitFor(() => {
      expect(mocks.setMeta).toHaveBeenCalledWith("workspace_collapsed_project_paths", JSON.stringify([]));
    });

    fireEvent.click(getProjectToggle(container, "corobase"));

    await waitFor(() => {
      expect(mocks.setMeta).toHaveBeenCalledWith(
        "workspace_collapsed_project_paths",
        JSON.stringify(["/tmp/corobase"]),
      );
    });

    fireEvent.click(getProjectToggle(container, "corobase"));

    await waitFor(() => {
      expect(mocks.setMeta).toHaveBeenCalledWith("workspace_collapsed_project_paths", JSON.stringify([]));
    });
  });

  it("updates active thread style and the thread panel title on click", () => {
    const { container } = renderWorkspaceShell();
    const threadButtons = Array.from(container.querySelectorAll<HTMLButtonElement>(".workspace-thread-item"));
    expect(threadButtons.length).toBeGreaterThan(1);

    fireEvent.click(threadButtons[1]);

    expect(threadButtons[1]).toHaveClass("is-active");
    expect(container.querySelector(".thread-panel-title")?.textContent).toBe("规划 MVP 任务与 Agent 流程");
  });

  it("opens settings from the footer menu", () => {
    renderWorkspaceShell();

    fireEvent.click(screen.getByText("设置"));
    fireEvent.click(screen.getAllByText("设置")[1]);

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it(
    "expands language options in the footer menu and switches locale",
    () => {
      renderWorkspaceShell();

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
    "switches the right panel controls and opens the runtime dialog",
    async () => {
      renderWorkspaceShell();

      fireEvent.click(screen.getByRole("button", { name: "打开 VS Code" }));
      fireEvent.click(screen.getByText("默认应用"));
      expect(screen.getByRole("button", { name: "打开 默认应用" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "提交 提交" }));
      fireEvent.click(screen.getByText("自动"));
      expect(screen.getByRole("button", { name: "提交 自动" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^Codex$/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "选择 Runtime" })).toBeInTheDocument();
      });

      expect(screen.getByText("KIMI")).toBeInTheDocument();
      expect(screen.queryByText("当前线程")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("tab", { name: "LLM" }));
      expect(screen.queryByText("Gemini")).not.toBeInTheDocument();
      fireEvent.click(screen.getByText("KIMI"));
      expect(screen.getByText("连接 Runtime")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "关闭 Runtime 选择器" }));
      expect(screen.queryByRole("dialog", { name: "选择 Runtime" })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^高$/i }));
      fireEvent.click(screen.getByText("中"));
      expect(screen.getByRole("button", { name: /^中$/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /计划/i }));
      fireEvent.click(screen.getByText("对话"));
      expect(screen.getByRole("button", { name: /对话/i })).toBeInTheDocument();
    },
    30_000,
  );

  it(
    "authorizes a runtime with api key and updates the thread runtime button",
    async () => {
      mockIPC((command, payload) => {
        if (command === "authorize_runtime_with_api_key") {
          expect(payload).toEqual({
            apiKey: "sk-test-12345678",
            runtimeId: "kimi",
          });
          return {
            metadata: {
              runtimeId: "kimi",
              status: "authorized",
              authMethod: "apiKey",
              verifiedAt: 123,
              accountLabel: "sk--****5678",
            },
          };
        }

        return undefined;
      });

      renderWorkspaceShell();

      fireEvent.click(screen.getByRole("button", { name: /^Codex$/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "选择 Runtime" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("KIMI"));
      fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sk-test-12345678" } });
      fireEvent.click(screen.getByRole("button", { name: "校验并连接" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^KIMI$/i })).toBeInTheDocument();
      });

      expect(mocks.setMeta).toHaveBeenCalledWith(
        "runtime_auth_metadata_v2",
        expect.stringContaining("\"runtimeId\":\"kimi\""),
      );
    },
    20_000,
  );

  it(
    "shows oauth as coming soon for codex and keeps the action disabled",
    async () => {
      renderWorkspaceShell();

      fireEvent.click(screen.getByRole("button", { name: /^Codex$/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "选择 Runtime" })).toBeInTheDocument();
      });

      const oauthChip = screen.getByRole("button", { name: /OAuth.*即将支持/i });
      expect(oauthChip).toBeDisabled();
      expect(screen.queryByText("该授权方式会在后续阶段开放。")).not.toBeInTheDocument();
    },
    20_000,
  );

  it(
    "keeps gemini oauth selectable while blocking the connect action when the build has no google sign-in",
    async () => {
      useRuntimeStore.setState({
        isRuntimeBootstrapped: true,
        defaultRuntimeId: null,
        authMetadataById: {},
        runtimeAuthAvailabilityById: {
          "gemini-cli": {
            apiKey: "available",
            oauth: "unavailable",
            reason: "build_not_configured",
          },
        },
      });

      renderWorkspaceShell();

      fireEvent.click(screen.getByRole("button", { name: /^Codex$/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "选择 Runtime" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Gemini"));

      const oauthChip = screen.getByRole("button", { name: "OAuth" });
      expect(oauthChip).toBeEnabled();
      fireEvent.click(oauthChip);

      expect(screen.getByRole("button", { name: "使用 OAuth 连接" })).toBeDisabled();
      expect(screen.getByText("当前构建未启用 Google 登录。")).toBeInTheDocument();
    },
    20_000,
  );

  it(
    "completes gemini oauth and updates the thread runtime button",
    async () => {
      let pollCount = 0;

      mockIPC((command, payload) => {
        if (command === "start_runtime_oauth") {
          expect(payload).toEqual({ runtimeId: "gemini-cli" });
          return {
            sessionId: "oauth-session-1",
            authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=oauth-session-1",
          };
        }

        if (command === "poll_runtime_oauth_session") {
          expect(payload).toEqual({ sessionId: "oauth-session-1" });
          pollCount += 1;

          return pollCount === 1
            ? {
                state: "succeeded",
                metadata: {
                  runtimeId: "gemini-cli",
                  status: "authorized",
                  authMethod: "oauth",
                  verifiedAt: 456,
                  expiresAt: 789,
                  accountLabel: "user@example.com",
                  subjectId: "subject-1",
                  scopes: ["openid", "email"],
                },
              }
            : {
                state: "cancelled",
              };
        }

        return undefined;
      });

      renderWorkspaceShell();

      fireEvent.click(screen.getByRole("button", { name: /^Codex$/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "选择 Runtime" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Gemini"));
      expect(screen.getByText("将在浏览器中完成 Google 登录，刷新令牌会安全保存在当前设备。")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "使用 OAuth 连接" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^Gemini$/i })).toBeInTheDocument();
      });

      expect(mocks.setMeta).toHaveBeenCalledWith(
        "runtime_auth_metadata_v2",
        expect.stringContaining("\"runtimeId\":\"gemini-cli\""),
      );
    },
    20_000,
  );

  it("keeps the send button disabled in phase one", () => {
    renderWorkspaceShell();
    expect(screen.getByLabelText("发送")).toBeDisabled();
  });

  it("copies the thread title through the clipboard client", () => {
    mockIPC((command, payload) => {
      expect(command).toBe("plugin:clipboard-manager|write_text");
      expect(payload).toEqual({ opts: undefined, text: "新线程" });
      return undefined;
    });

    renderWorkspaceShell();
    fireEvent.click(screen.getByLabelText("复制线程标题"));
  });

  it(
    "triggers add project callback from header action",
    () => {
      renderWorkspaceShell();

      fireEvent.click(screen.getByLabelText("添加项目"));
      expect(onAddProject).toHaveBeenCalledTimes(1);
    },
    20_000,
  );
});
