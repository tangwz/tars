import { beforeEach, describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import { runtimeAuthService } from "../../src/features/runtime/runtimeAuthService";
import { useRuntimeStore } from "../../src/stores/runtimeStore";

describe("runtimeAuthService", () => {
  beforeEach(() => {
    useRuntimeStore.setState({
      isRuntimeBootstrapped: true,
      defaultRuntimeId: null,
      authMetadataById: {},
      runtimeAuthAvailabilityById: {},
    });

    mockIPC((command, payload) => {
      if (command === "authorize_runtime_with_api_key") {
        expect(payload).toEqual({ apiKey: "sk-test-12345678", runtimeId: "kimi" });

        return {
          metadata: {
            runtimeId: "kimi",
            status: "authorized",
            authMethod: "apiKey",
            verifiedAt: 123,
            accountLabel: "sk--****5678",
          },
        };
      }

      if (command === "start_runtime_oauth") {
        expect(payload).toEqual({ runtimeId: "gemini-cli" });
        return {
          sessionId: "oauth-session-1",
          authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=oauth-session-1",
        };
      }

      if (command === "poll_runtime_oauth_session") {
        expect(payload).toEqual({ sessionId: "oauth-session-1" });
        return {
          state: "succeeded",
          metadata: {
            runtimeId: "gemini-cli",
            status: "authorized",
            authMethod: "oauth",
            verifiedAt: 456,
            expiresAt: 999,
            accountLabel: "user@example.com",
            subjectId: "subject-1",
            scopes: ["openid", "email"],
          },
        };
      }

      if (command === "cancel_runtime_oauth") {
        expect(payload).toEqual({ sessionId: "oauth-session-1" });
        return null;
      }

      if (command === "revoke_runtime_auth") {
        return null;
      }

      return undefined;
    });
  });

  it("authorizes an api key runtime through the tauri auth command", async () => {
    const metadata = await runtimeAuthService.authorizeWithApiKey("kimi", "sk-test-12345678");

    expect(metadata.runtimeId).toBe("kimi");
    expect(metadata.authMethod).toBe("apiKey");
    expect(metadata.status).toBe("authorized");
    expect(metadata.accountLabel).toContain("****");
  });

  it("rejects empty api keys before calling tauri", async () => {
    await expect(runtimeAuthService.authorizeWithApiKey("kimi", "   ")).rejects.toMatchObject({
      code: "invalid_credentials",
    });
  });

  it("starts oauth when the runtime exposes it", async () => {
    await expect(runtimeAuthService.startOAuth("gemini-cli")).resolves.toMatchObject({
      sessionId: "oauth-session-1",
    });
  });

  it("polls an oauth session through tauri", async () => {
    await expect(runtimeAuthService.pollOAuthSession("oauth-session-1")).resolves.toMatchObject({
      state: "succeeded",
      metadata: expect.objectContaining({
        runtimeId: "gemini-cli",
        authMethod: "oauth",
      }),
    });
  });

  it("cancels an oauth session through tauri", async () => {
    await expect(runtimeAuthService.cancelOAuthSession("oauth-session-1")).resolves.toBeUndefined();
  });

  it("rejects oauth start when the runtime keeps it disabled", async () => {
    await expect(runtimeAuthService.startOAuth("codex")).rejects.toMatchObject({
      code: "unsupported_auth_method",
    });
  });

  it("rejects gemini oauth when the current build marks it unavailable", async () => {
    useRuntimeStore.setState({
      runtimeAuthAvailabilityById: {
        "gemini-cli": {
          apiKey: "available",
          oauth: "unavailable",
          reason: "build_not_configured",
        },
      },
    });

    await expect(runtimeAuthService.startOAuth("gemini-cli")).rejects.toMatchObject({
      code: "unsupported_auth_method",
    });
  });

  it("revokes stored runtime credentials", async () => {
    await expect(runtimeAuthService.revoke("glm")).resolves.toBeUndefined();
  });
});
