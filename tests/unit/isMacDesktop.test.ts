import { describe, expect, it } from "vitest";
import { isMacDesktop } from "../../src/lib/platform/isMacDesktop";

describe("isMacDesktop", () => {
  it("returns true for a macOS platform", () => {
    expect(
      isMacDesktop({
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_0) AppleWebKit/605.1.15",
      }),
    ).toBe(true);
  });

  it("returns false for non-macOS platforms", () => {
    expect(
      isMacDesktop({
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }),
    ).toBe(false);
    expect(
      isMacDesktop({
        platform: "Linux x86_64",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      }),
    ).toBe(false);
  });
});
