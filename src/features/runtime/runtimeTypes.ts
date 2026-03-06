export type RuntimeKind = "llm" | "coding-agent";

export type RuntimeId = "kimi" | "codex" | "gemini-cli" | "glm";

export type RuntimeProviderId = "moonshot" | "openai" | "google" | "zhipu";

export type AuthMethod = "apiKey" | "oauth";

export type RuntimeAuthStatus = "authorized" | "expired";

export type RuntimeAuthMethodAvailability = "available" | "comingSoon";

export interface RuntimeAuthMethodSpec {
  method: AuthMethod;
  availability: RuntimeAuthMethodAvailability;
}

export interface RuntimeSelection {
  runtimeId: RuntimeId | null;
  source: "default" | "thread";
}

export interface RuntimeCatalogItem {
  id: RuntimeId;
  displayName: string;
  kind: RuntimeKind;
  description: string;
  auth: RuntimeAuthMethodSpec[];
  defaultAuthMethod: AuthMethod;
  provider: RuntimeProviderId;
}

export interface RuntimeAuthMetadata {
  runtimeId: RuntimeId;
  status: RuntimeAuthStatus;
  authMethod: AuthMethod;
  verifiedAt: number;
  expiresAt?: number;
  accountLabel?: string;
  subjectId?: string;
  scopes?: string[];
}

export interface RuntimeDefaultSelection {
  defaultRuntimeId: RuntimeId | null;
}

export interface RuntimeSecretStatus {
  runtimeId: RuntimeId;
  exists: boolean;
  expiresAt?: number;
}

export interface RuntimeAuthAvailability {
  apiKey?: "available" | "unavailable";
  oauth?: "available" | "unavailable";
  reason?: "build_not_configured";
}

export type RuntimeAuthAvailabilityMap = Partial<Record<RuntimeId, RuntimeAuthAvailability>>;

export interface RuntimeAuthCommandResult {
  metadata: RuntimeAuthMetadata;
}

export interface RuntimeAuthError {
  code:
    | "invalid_credentials"
    | "expired_credentials"
    | "network_unreachable"
    | "provider_unavailable"
    | "rate_limited"
    | "oauth_cancelled"
    | "oauth_timeout"
    | "secure_storage_failed"
    | "unsupported_auth_method";
  message: string;
  recoverable: boolean;
}

export interface StartOAuthResult {
  sessionId: string;
  authorizationUrl?: string;
}

export type OAuthSessionStatus =
  | { state: "pending"; openedBrowserAt?: number }
  | { state: "succeeded"; metadata: RuntimeAuthMetadata }
  | { state: "failed"; error: RuntimeAuthError }
  | { state: "cancelled" }
  | { state: "timed_out" };
