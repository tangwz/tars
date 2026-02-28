import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface TauriCapability {
  permissions?: string[];
}

interface TauriWindowConfig {
  hiddenTitle?: boolean;
  label?: string;
  titleBarStyle?: string;
}

interface TauriConfig {
  app?: {
    windows?: TauriWindowConfig[];
  };
}

describe("tauri capability", () => {
  it("grants read access for arbitrary local paths", () => {
    const capabilityPath = resolve(process.cwd(), "src-tauri/capabilities/default.json");
    const capability = JSON.parse(readFileSync(capabilityPath, "utf-8")) as TauriCapability;
    const permissions = capability.permissions ?? [];

    expect(permissions).toContain("fs:read-all");
    expect(permissions).toContain("core:window:allow-start-dragging");
  });

  it("uses the macOS overlay title bar configuration on the main window", () => {
    const configPath = resolve(process.cwd(), "src-tauri/tauri.conf.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8")) as TauriConfig;
    const mainWindow = config.app?.windows?.[0];

    expect(mainWindow?.label).toBe("main");
    expect(mainWindow?.titleBarStyle).toBe("Overlay");
    expect(mainWindow?.hiddenTitle).toBe(true);
  });
});
