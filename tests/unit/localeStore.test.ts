import { beforeEach, describe, expect, it } from "vitest";
import { useLocaleStore } from "../../src/stores/localeStore";

describe("localeStore", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en", isLocaleBootstrapped: false });
  });

  it("updates locale", () => {
    useLocaleStore.getState().setLocale("zh-CN");
    expect(useLocaleStore.getState().locale).toBe("zh-CN");
  });

  it("tracks bootstrap status", () => {
    useLocaleStore.getState().setLocaleBootstrapped(true);
    expect(useLocaleStore.getState().isLocaleBootstrapped).toBe(true);
  });
});

