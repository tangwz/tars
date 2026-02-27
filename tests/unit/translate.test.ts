import { describe, expect, it } from "vitest";
import { t } from "../../src/lib/i18n/translate";

describe("translate", () => {
  it("returns translated text for english and simplified chinese", () => {
    expect(t("en", "startup.openProject")).toBe("Open Project");
    expect(t("zh-CN", "startup.openProject")).toBe("打开项目");
  });

  it("applies interpolation params", () => {
    expect(t("en", "startup.recentLimit", { count: 3 })).toBe("3/5");
    expect(t("zh-CN", "startup.recentLimit", { count: 4 })).toBe("4/5");
  });
});

