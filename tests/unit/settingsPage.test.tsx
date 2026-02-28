import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { SettingsPage } from "../../src/pages/SettingsPage";
import { useLocaleStore } from "../../src/stores/localeStore";
import { useWorkspaceStore } from "../../src/stores/workspaceStore";

describe("SettingsPage", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en", isLocaleBootstrapped: true });
    useWorkspaceStore.setState({
      currentProjectPath: "/tmp/tars",
      recentProjects: [],
      selectedProjectPath: "/tmp/tars",
      selectedThreadId: null,
      isDatabaseReady: true,
    });
  });

  it("renders the split settings layout without a locale switcher", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/settings"]}>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(container.textContent).toContain("Back to app");
    expect(container.querySelector(".settings-sidebar-titlebar")).toHaveAttribute("data-tauri-drag-region");
    expect(container.querySelector(".settings-title")?.textContent).toBe("General");
    expect(screen.getByText("MCP Servers")).toBeInTheDocument();
    expect(screen.queryByText("Simplified Chinese")).not.toBeInTheDocument();
    expect(screen.queryByText("简体中文")).not.toBeInTheDocument();
    expect(useLocaleStore.getState().locale).toBe("en");
  });
});
