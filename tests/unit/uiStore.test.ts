import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "../../src/stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: "light",
      startupError: "",
      isLoadingRecent: true,
      isOpeningProject: false,
      isSettingsOpen: false,
    });
  });

  it("toggles theme and startup states", () => {
    useUIStore.getState().toggleTheme();
    useUIStore.getState().setIsLoadingRecent(false);
    useUIStore.getState().setIsOpeningProject(true);

    expect(useUIStore.getState().theme).toBe("dark");
    expect(useUIStore.getState().isLoadingRecent).toBe(false);
    expect(useUIStore.getState().isOpeningProject).toBe(true);
  });

  it("stores startup error messages", () => {
    useUIStore.getState().setStartupError("boom");
    expect(useUIStore.getState().startupError).toBe("boom");
  });
});

