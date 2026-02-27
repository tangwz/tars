import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface TauriCapability {
  permissions?: string[];
}

describe("tauri capability", () => {
  it("grants read access for arbitrary local paths", () => {
    const capabilityPath = resolve(process.cwd(), "src-tauri/capabilities/default.json");
    const capability = JSON.parse(readFileSync(capabilityPath, "utf-8")) as TauriCapability;
    const permissions = capability.permissions ?? [];

    expect(permissions).toContain("fs:read-all");
  });
});
