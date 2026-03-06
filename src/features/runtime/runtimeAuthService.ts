import { getRuntimeCatalogItem } from "@/features/runtime/runtimeCatalog";
import { isRuntimeAuthMethodAvailable } from "@/features/runtime/runtimeAuthCapabilities";
import type {
  AuthMethod,
  OAuthSessionStatus,
  RuntimeAuthMetadata,
  RuntimeAuthError,
  RuntimeId,
  StartOAuthResult,
} from "@/features/runtime/runtimeTypes";
import {
  authorizeRuntimeWithApiKey,
  cancelRuntimeOAuth,
  pollRuntimeOAuthSession,
  revokeRuntimeAuth,
  startRuntimeOAuth,
} from "@/services/tauri/runtimeSecretClient";
import { useRuntimeStore } from "@/stores/runtimeStore";

function createUnsupportedAuthMethodError(runtimeId: RuntimeId, authMethod: AuthMethod): RuntimeAuthError {
  const runtime = getRuntimeCatalogItem(runtimeId);

  return {
    code: "unsupported_auth_method",
    message: `${runtime.displayName} does not support ${authMethod} authentication in this build.`,
    recoverable: false,
  };
}

function assertAvailableAuthMethod(runtimeId: RuntimeId, authMethod: AuthMethod): void {
  const runtimeAvailability = useRuntimeStore.getState().runtimeAuthAvailabilityById[runtimeId];

  if (!isRuntimeAuthMethodAvailable(runtimeId, authMethod, runtimeAvailability)) {
    throw createUnsupportedAuthMethodError(runtimeId, authMethod);
  }
}

export const runtimeAuthService = {
  async authorizeWithApiKey(runtimeId: RuntimeId, apiKey: string): Promise<RuntimeAuthMetadata> {
    assertAvailableAuthMethod(runtimeId, "apiKey");

    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      throw {
        code: "invalid_credentials",
        message: "API key must not be empty.",
        recoverable: true,
      } satisfies RuntimeAuthError;
    }

    const result = await authorizeRuntimeWithApiKey(runtimeId, trimmedKey);
    return result.metadata;
  },

  async startOAuth(runtimeId: RuntimeId): Promise<StartOAuthResult> {
    assertAvailableAuthMethod(runtimeId, "oauth");
    return startRuntimeOAuth(runtimeId);
  },

  async pollOAuthSession(sessionId: string): Promise<OAuthSessionStatus> {
    return pollRuntimeOAuthSession(sessionId);
  },

  async cancelOAuthSession(sessionId: string): Promise<void> {
    await cancelRuntimeOAuth(sessionId);
  },

  async revoke(runtimeId: RuntimeId): Promise<void> {
    await revokeRuntimeAuth(runtimeId);
  },
};
