import type { RuntimeAuthMetadata, RuntimeDefaultSelection, RuntimeId } from "@/features/runtime/runtimeTypes";
import { getMeta, setMeta } from "@/services/persistence/projectRepository";

const DEFAULT_SELECTION_META_KEY = "runtime_default_selection_v1";
const AUTH_METADATA_META_KEY_V1 = "runtime_auth_metadata_v1";
const AUTH_METADATA_META_KEY_V2 = "runtime_auth_metadata_v2";

type RuntimeAuthMetadataMap = Partial<Record<RuntimeId, RuntimeAuthMetadata>>;

function isRuntimeId(value: unknown): value is RuntimeId {
  return value === "kimi" || value === "codex" || value === "gemini-cli" || value === "glm";
}

function parseDefaultSelection(raw: string | null): RuntimeDefaultSelection {
  if (!raw) {
    return { defaultRuntimeId: null };
  }

  try {
    const parsed = JSON.parse(raw) as { defaultRuntimeId?: unknown };

    return {
      defaultRuntimeId: isRuntimeId(parsed.defaultRuntimeId) ? parsed.defaultRuntimeId : null,
    };
  } catch {
    return { defaultRuntimeId: null };
  }
}

function parseAuthMetadata(raw: string | null): RuntimeAuthMetadataMap {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<RuntimeAuthMetadata>>;

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([runtimeId, value]) => {
          return (
            isRuntimeId(runtimeId) &&
            value &&
            value.runtimeId === runtimeId &&
            (value.status === "authorized" || value.status === "expired") &&
            (value.authMethod === "apiKey" || value.authMethod === "oauth") &&
            typeof value.verifiedAt === "number"
          );
        })
        .map(([runtimeId, value]) => [
          runtimeId,
          {
            accountLabel: typeof value.accountLabel === "string" ? value.accountLabel : undefined,
            authMethod: value.authMethod as RuntimeAuthMetadata["authMethod"],
            expiresAt: typeof value.expiresAt === "number" ? value.expiresAt : undefined,
            runtimeId: runtimeId as RuntimeId,
            status: value.status as RuntimeAuthMetadata["status"],
            scopes: Array.isArray(value.scopes) ? value.scopes.filter((scope): scope is string => typeof scope === "string") : undefined,
            subjectId: typeof value.subjectId === "string" ? value.subjectId : undefined,
            verifiedAt: value.verifiedAt as number,
          } satisfies RuntimeAuthMetadata,
        ]),
    );
  } catch {
    return {};
  }
}

export async function getRuntimeDefaultSelection(): Promise<RuntimeDefaultSelection> {
  return parseDefaultSelection(await getMeta(DEFAULT_SELECTION_META_KEY));
}

export async function setRuntimeDefaultSelection(selection: RuntimeDefaultSelection): Promise<void> {
  await setMeta(DEFAULT_SELECTION_META_KEY, JSON.stringify(selection));
}

export async function getRuntimeAuthMetadataMap(): Promise<RuntimeAuthMetadataMap> {
  const v2 = await getMeta(AUTH_METADATA_META_KEY_V2);

  if (v2) {
    return parseAuthMetadata(v2);
  }

  return parseAuthMetadata(await getMeta(AUTH_METADATA_META_KEY_V1));
}

export async function setRuntimeAuthMetadataMap(metadataById: RuntimeAuthMetadataMap): Promise<void> {
  await setMeta(AUTH_METADATA_META_KEY_V2, JSON.stringify(metadataById));
}
