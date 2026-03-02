export type RuntimeKind = "llm" | "coding-agent";

export type RuntimeId = "kimi" | "codex" | "gemini-cli" | "glm";

export type AuthMethod = "apiKey" | "oauth";

export interface RuntimeSelection {
  runtimeId: RuntimeId | null;
  source: "default" | "thread";
}

export interface RuntimeCatalogItem {
  id: RuntimeId;
  displayName: string;
  kind: RuntimeKind;
  description: string;
  authMethods: AuthMethod[];
  defaultAuthMethod: AuthMethod;
}

export interface RuntimeAuthMetadata {
  runtimeId: RuntimeId;
  status: "authorized" | "expired";
  authMethod: AuthMethod;
  verifiedAt: number;
  accountLabel?: string;
}

export interface RuntimeDefaultSelection {
  defaultRuntimeId: RuntimeId | null;
}
