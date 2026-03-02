import { getRuntimeCatalogItem } from "@/features/runtime/runtimeCatalog";
import type { AuthMethod, RuntimeAuthMetadata, RuntimeId } from "@/features/runtime/runtimeTypes";
import { deleteRuntimeSecret, storeRuntimeSecret } from "@/services/tauri/runtimeSecretClient";

function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();

  if (trimmed.length <= 8) {
    return "****";
  }

  return `${trimmed.slice(0, 3)}-****${trimmed.slice(-4)}`;
}

function assertAuthMethod(runtimeId: RuntimeId, authMethod: AuthMethod): void {
  const runtime = getRuntimeCatalogItem(runtimeId);

  if (!runtime.authMethods.includes(authMethod)) {
    throw new Error(`${runtime.displayName} does not support ${authMethod} authentication.`);
  }
}

export const runtimeAuthService = {
  async authorizeWithApiKey(runtimeId: RuntimeId, apiKey: string): Promise<RuntimeAuthMetadata> {
    assertAuthMethod(runtimeId, "apiKey");

    const trimmedKey = apiKey.trim();

    if (trimmedKey.length < 8) {
      throw new Error("API key must be at least 8 characters.");
    }

    await storeRuntimeSecret(runtimeId, JSON.stringify({ apiKey: trimmedKey, type: "apiKey" }));

    return {
      accountLabel: maskApiKey(trimmedKey),
      authMethod: "apiKey",
      runtimeId,
      status: "authorized",
      verifiedAt: Date.now(),
    };
  },

  async authorizeWithOAuth(runtimeId: RuntimeId): Promise<RuntimeAuthMetadata> {
    assertAuthMethod(runtimeId, "oauth");

    const runtime = getRuntimeCatalogItem(runtimeId);
    const payload = {
      accessToken: `oauth_${runtimeId}_${Date.now()}`,
      issuedAt: Date.now(),
      type: "oauth",
    };

    await storeRuntimeSecret(runtimeId, JSON.stringify(payload));

    return {
      accountLabel: `${runtime.displayName} OAuth`,
      authMethod: "oauth",
      runtimeId,
      status: "authorized",
      verifiedAt: Date.now(),
    };
  },

  async revoke(runtimeId: RuntimeId): Promise<void> {
    await deleteRuntimeSecret(runtimeId);
  },
};
