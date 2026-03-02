import { beforeEach, describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import { runtimeAuthService } from "../../src/features/runtime/runtimeAuthService";

describe("runtimeAuthService", () => {
  beforeEach(() => {
    mockIPC((command) => {
      if (command === "store_runtime_secret" || command === "delete_runtime_secret") {
        return null;
      }

      return undefined;
    });
  });

  it("authorizes an api key runtime and masks the account label", async () => {
    const metadata = await runtimeAuthService.authorizeWithApiKey("kimi", "sk-test-12345678");

    expect(metadata.runtimeId).toBe("kimi");
    expect(metadata.authMethod).toBe("apiKey");
    expect(metadata.status).toBe("authorized");
    expect(metadata.accountLabel).toContain("****");
  });

  it("rejects short api keys", async () => {
    await expect(runtimeAuthService.authorizeWithApiKey("kimi", "short")).rejects.toThrow(/at least 8/i);
  });

  it("authorizes oauth runtimes", async () => {
    const metadata = await runtimeAuthService.authorizeWithOAuth("codex");

    expect(metadata.runtimeId).toBe("codex");
    expect(metadata.authMethod).toBe("oauth");
    expect(metadata.status).toBe("authorized");
  });

  it("revokes stored runtime credentials", async () => {
    await expect(runtimeAuthService.revoke("glm")).resolves.toBeUndefined();
  });
});
