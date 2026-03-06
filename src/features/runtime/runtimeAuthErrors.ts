import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import type { RuntimeAuthError } from "@/features/runtime/runtimeTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isRuntimeAuthError(value: unknown): value is RuntimeAuthError {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    typeof value.recoverable === "boolean"
  );
}

export function coerceRuntimeAuthError(error: unknown): RuntimeAuthError {
  if (isRuntimeAuthError(error)) {
    return error;
  }

  if (isRecord(error) && isRuntimeAuthError(error.data)) {
    return error.data;
  }

  return {
    code: "provider_unavailable",
    message: error instanceof Error ? error.message : String(error),
    recoverable: true,
  };
}

export function getRuntimeAuthErrorMessage(locale: Locale, error: unknown): string {
  const normalized = coerceRuntimeAuthError(error);

  switch (normalized.code) {
    case "invalid_credentials":
      return t(locale, "workspace.runtime.errorInvalidCredentials");
    case "expired_credentials":
      return t(locale, "workspace.runtime.errorExpiredCredentials");
    case "network_unreachable":
      return t(locale, "workspace.runtime.errorNetworkUnreachable");
    case "provider_unavailable":
      if (normalized.message.includes("Gemini OAuth is not configured in this build")) {
        return t(locale, "workspace.runtime.errorOauthBuildNotConfigured");
      }

      if (normalized.message.includes("failed to open browser for OAuth")) {
        return t(locale, "workspace.runtime.errorBrowserOpenFailed");
      }

      if (
        normalized.message.includes("OAuth state mismatch") ||
        normalized.message.includes("missing OAuth state parameter") ||
        normalized.message.includes("missing OAuth authorization code")
      ) {
        return t(locale, "workspace.runtime.errorOauthCallbackFailed");
      }

      return t(locale, "workspace.runtime.errorProviderUnavailable");
    case "rate_limited":
      return t(locale, "workspace.runtime.errorRateLimited");
    case "oauth_cancelled":
      return t(locale, "workspace.runtime.errorOauthCancelled");
    case "oauth_timeout":
      return t(locale, "workspace.runtime.errorOauthTimeout");
    case "secure_storage_failed":
      return t(locale, "workspace.runtime.errorSecureStorageFailed");
    case "unsupported_auth_method":
      return t(locale, "workspace.runtime.errorUnsupportedAuthMethod");
    default:
      return normalized.message;
  }
}
