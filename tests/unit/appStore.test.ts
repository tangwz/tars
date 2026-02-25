import { beforeEach, describe, expect, it } from "vitest";
import { appSelectors, useAppStore } from "../../src/lib/store/appStore";

describe("appStore", () => {
  beforeEach(() => {
    useAppStore.setState({ theme: "light" });
  });

  it("defaults to light theme", () => {
    expect(useAppStore.getState().theme).toBe("light");
  });

  it("setTheme updates theme", () => {
    useAppStore.getState().setTheme("dark");
    expect(useAppStore.getState().theme).toBe("dark");
  });

  it("toggleTheme works from getState", () => {
    const toggleTheme = appSelectors.toggleTheme(useAppStore.getState());
    toggleTheme();
    expect(useAppStore.getState().theme).toBe("dark");
  });
});
