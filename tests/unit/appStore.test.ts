import { beforeEach, describe, expect, it } from "vitest";
import { appSelectors, useAppStore } from "../../src/lib/store/appStore";

describe("appStore", () => {
  beforeEach(() => {
    useAppStore.setState({ theme: "light", locale: "en", currentProjectPath: null, startupError: "" });
  });

  it("defaults to light theme", () => {
    expect(useAppStore.getState().theme).toBe("light");
  });

  it("setTheme updates theme", () => {
    useAppStore.getState().setTheme("dark");
    expect(useAppStore.getState().theme).toBe("dark");
  });

  it("setLocale updates locale", () => {
    useAppStore.getState().setLocale("zh-CN");
    expect(useAppStore.getState().locale).toBe("zh-CN");
  });

  it("toggleTheme works from getState", () => {
    const toggleTheme = appSelectors.toggleTheme(useAppStore.getState());
    toggleTheme();
    expect(useAppStore.getState().theme).toBe("dark");
  });
});
