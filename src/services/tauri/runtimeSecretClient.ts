import { invoke } from "@tauri-apps/api/core";
import type {
  OAuthSessionStatus,
  RuntimeAuthAvailabilityMap,
  RuntimeAuthCommandResult,
  RuntimeAuthError,
  RuntimeId,
  RuntimeSecretStatus,
  StartOAuthResult,
} from "@/features/runtime/runtimeTypes";
import { coerceRuntimeAuthError } from "@/features/runtime/runtimeAuthErrors";

function normalizeRuntimeAuthError(error: unknown): RuntimeAuthError {
  return coerceRuntimeAuthError(error);
}

export async function authorizeRuntimeWithApiKey(runtimeId: RuntimeId, apiKey: string): Promise<RuntimeAuthCommandResult> {
  try {
    return await invoke<RuntimeAuthCommandResult>("authorize_runtime_with_api_key", { apiKey, runtimeId });
  } catch (error) {
    throw normalizeRuntimeAuthError(error);
  }
}

export async function getRuntimeSecretStatuses(runtimeIds: RuntimeId[]): Promise<RuntimeSecretStatus[]> {
  try {
    return await invoke<RuntimeSecretStatus[]>("get_runtime_secret_statuses", { runtimeIds });
  } catch (error) {
    throw normalizeRuntimeAuthError(error);
  }
}

export async function getRuntimeAuthAvailability(): Promise<RuntimeAuthAvailabilityMap> {
  try {
    return await invoke<RuntimeAuthAvailabilityMap>("get_runtime_auth_availability");
  } catch (error) {
    throw normalizeRuntimeAuthError(error);
  }
}

export async function startRuntimeOAuth(runtimeId: RuntimeId): Promise<StartOAuthResult> {
  try {
    return await invoke<StartOAuthResult>("start_runtime_oauth", { runtimeId });
  } catch (error) {
    throw normalizeRuntimeAuthError(error);
  }
}

export async function pollRuntimeOAuthSession(sessionId: string): Promise<OAuthSessionStatus> {
  try {
    return await invoke<OAuthSessionStatus>("poll_runtime_oauth_session", { sessionId });
  } catch (error) {
    throw normalizeRuntimeAuthError(error);
  }
}

export async function cancelRuntimeOAuth(sessionId: string): Promise<void> {
  try {
    await invoke("cancel_runtime_oauth", { sessionId });
  } catch (error) {
    throw normalizeRuntimeAuthError(error);
  }
}

export async function revokeRuntimeAuth(runtimeId: RuntimeId): Promise<void> {
  try {
    await invoke("revoke_runtime_auth", { runtimeId });
  } catch (error) {
    throw normalizeRuntimeAuthError(error);
  }
}
