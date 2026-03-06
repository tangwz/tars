import { getRuntimeCatalogItem } from "@/features/runtime/runtimeCatalog";
import type {
  AuthMethod,
  RuntimeAuthAvailability,
  RuntimeAuthMethodSpec,
  RuntimeId,
} from "@/features/runtime/runtimeTypes";

export function getRuntimeAuthMethodSpec(runtimeId: RuntimeId, method: AuthMethod): RuntimeAuthMethodSpec | undefined {
  return getRuntimeCatalogItem(runtimeId).auth.find((candidate) => candidate.method === method);
}

export function isRuntimeAuthMethodAvailable(
  runtimeId: RuntimeId,
  method: AuthMethod,
  runtimeAuthAvailability?: RuntimeAuthAvailability,
): boolean {
  const spec = getRuntimeAuthMethodSpec(runtimeId, method);

  if (spec?.availability !== "available") {
    return false;
  }

  const runtimeValue = runtimeAuthAvailability?.[method];
  return runtimeValue !== "unavailable";
}

export function getPreferredRuntimeAuthMethod(
  runtimeId: RuntimeId,
  runtimeAuthAvailability?: RuntimeAuthAvailability,
): AuthMethod {
  const runtime = getRuntimeCatalogItem(runtimeId);
  const preferred = getRuntimeAuthMethodSpec(runtimeId, runtime.defaultAuthMethod);

  if (
    preferred?.availability === "available" &&
    isRuntimeAuthMethodAvailable(runtimeId, preferred.method, runtimeAuthAvailability)
  ) {
    return preferred.method;
  }

  return (
    runtime.auth.find((candidate) => isRuntimeAuthMethodAvailable(runtimeId, candidate.method, runtimeAuthAvailability))
      ?.method ?? runtime.defaultAuthMethod
  );
}
