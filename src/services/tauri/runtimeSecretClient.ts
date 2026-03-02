import { invoke } from "@tauri-apps/api/core";
import { getErrorMessage } from "@/services/tauri/errorMessage";
import type { RuntimeId } from "@/features/runtime/runtimeTypes";

export async function storeRuntimeSecret(runtimeId: RuntimeId, payload: string): Promise<void> {
  try {
    await invoke("store_runtime_secret", { payload, runtimeId });
  } catch (error) {
    throw new Error(`Failed to store runtime secret for "${runtimeId}": ${getErrorMessage(error)}`);
  }
}

export async function getRuntimeSecret(runtimeId: RuntimeId): Promise<string | null> {
  try {
    const payload = await invoke<string | null>("get_runtime_secret", { runtimeId });
    return payload ?? null;
  } catch (error) {
    throw new Error(`Failed to read runtime secret for "${runtimeId}": ${getErrorMessage(error)}`);
  }
}

export async function deleteRuntimeSecret(runtimeId: RuntimeId): Promise<void> {
  try {
    await invoke("delete_runtime_secret", { runtimeId });
  } catch (error) {
    throw new Error(`Failed to delete runtime secret for "${runtimeId}": ${getErrorMessage(error)}`);
  }
}
