import { getRuntimeAuthMethodSpec, isRuntimeAuthMethodAvailable } from "@/features/runtime/runtimeAuthCapabilities";
import { getRuntimeCatalogItem } from "@/features/runtime/runtimeCatalog";
import type {
  AuthMethod,
  RuntimeAuthAvailability,
  RuntimeAuthMetadata,
  RuntimeId,
} from "@/features/runtime/runtimeTypes";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";

interface RuntimeAuthPanelProps {
  locale: Locale;
  runtimeId: RuntimeId;
  authAvailability?: RuntimeAuthAvailability;
  metadata?: RuntimeAuthMetadata;
  selectedAuthMethod: AuthMethod;
  apiKey: string;
  setAsDefault: boolean;
  isVerifying: boolean;
  isOAuthPending: boolean;
  errorMessage: string;
  onChangeAuthMethod: (authMethod: AuthMethod) => void;
  onChangeApiKey: (value: string) => void;
  onChangeSetAsDefault: (value: boolean) => void;
  onAuthorizeApiKey: () => void;
  onAuthorizeOAuth: () => void;
  onCancelOAuth: () => void;
  onUseAuthorizedRuntime: () => void;
  onDisconnect: () => void;
}

function getOAuthHint(
  locale: Locale,
  runtimeId: RuntimeId,
  authAvailability: RuntimeAuthAvailability | undefined,
  isPending: boolean,
): string {
  if (isPending) {
    return t(locale, "workspace.runtime.oauthPendingHint");
  }

  if (runtimeId === "gemini-cli" && authAvailability?.oauth === "unavailable") {
    return t(locale, "workspace.runtime.oauthGeminiUnavailableHint");
  }

  if (runtimeId === "gemini-cli") {
    return t(locale, "workspace.runtime.oauthGoogleHint");
  }

  return t(locale, "workspace.runtime.oauthCodexUnavailableHint");
}

export function RuntimeAuthPanel(props: RuntimeAuthPanelProps) {
  const {
    locale,
    runtimeId,
    authAvailability,
    metadata,
    selectedAuthMethod,
    apiKey,
    setAsDefault,
    isVerifying,
    isOAuthPending,
    errorMessage,
    onChangeAuthMethod,
    onChangeApiKey,
    onChangeSetAsDefault,
    onAuthorizeApiKey,
    onAuthorizeOAuth,
    onCancelOAuth,
    onUseAuthorizedRuntime,
    onDisconnect,
  } = props;
  const runtime = getRuntimeCatalogItem(runtimeId);
  const isAuthorized = metadata?.status === "authorized";
  const selectedMethodSpec = getRuntimeAuthMethodSpec(runtimeId, selectedAuthMethod);
  const isSelectedMethodAvailable = isRuntimeAuthMethodAvailable(runtimeId, selectedAuthMethod, authAvailability);
  const showGeminiUnavailableHint =
    !isAuthorized &&
    runtimeId === "gemini-cli" &&
    authAvailability?.oauth === "unavailable" &&
    selectedAuthMethod !== "oauth";
  const isBusy = isVerifying || isOAuthPending;

  return (
    <div className="runtime-auth-panel">
      <div className="runtime-auth-header">
        <div>
          <h2 className="runtime-auth-title">
            {isAuthorized ? t(locale, "workspace.runtime.connectedTitle") : t(locale, "workspace.runtime.connectTitle")}
          </h2>
          <p className="runtime-auth-subtitle">{runtime.displayName}</p>
        </div>
        <span className={`runtime-auth-status${metadata?.status === "expired" ? " is-warning" : ""}`}>
          {metadata?.status === "authorized"
            ? t(locale, "workspace.runtime.statusAuthorized")
            : metadata?.status === "expired"
              ? t(locale, "workspace.runtime.statusExpired")
              : t(locale, "workspace.runtime.badgeNeedsAuth")}
        </span>
      </div>

      <p className="runtime-auth-description">{runtime.description}</p>

      <div className="runtime-auth-methods" role="group">
        {runtime.auth.map((spec) => {
          const isMethodAvailable = isRuntimeAuthMethodAvailable(runtimeId, spec.method, authAvailability);
          const isMethodSelectable = spec.availability === "available" && !isBusy;

          return (
            <button
              className={`runtime-auth-method-chip${selectedAuthMethod === spec.method ? " is-active" : ""}${!isMethodAvailable ? " is-disabled" : ""}`}
              disabled={!isMethodSelectable}
              key={spec.method}
              onClick={() => {
                onChangeAuthMethod(spec.method);
              }}
              type="button"
            >
              {t(locale, spec.method === "apiKey" ? "workspace.runtime.authMethodApiKey" : "workspace.runtime.authMethodOauth")}
              {spec.availability === "comingSoon" ? (
                <span className="runtime-auth-method-chip-note">{t(locale, "workspace.runtime.authMethodComingSoon")}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {!isAuthorized && selectedMethodSpec?.availability === "comingSoon" ? (
        <p className="runtime-auth-oauth-hint">{t(locale, "workspace.runtime.authMethodUnavailableHint")}</p>
      ) : null}
      {showGeminiUnavailableHint ? (
        <p className="runtime-auth-oauth-hint">{t(locale, "workspace.runtime.oauthGeminiUnavailableHint")}</p>
      ) : null}

      {isAuthorized ? (
        <div className="runtime-auth-connected-panel">
          <div className="runtime-auth-info-grid">
            <div className="runtime-auth-info-row">
              <span className="runtime-auth-info-label">{t(locale, "workspace.runtime.authMethod")}</span>
              <span className="runtime-auth-info-value">
                {t(locale, metadata.authMethod === "apiKey" ? "workspace.runtime.authMethodApiKey" : "workspace.runtime.authMethodOauth")}
              </span>
            </div>
            {metadata.accountLabel ? (
              <div className="runtime-auth-info-row">
                <span className="runtime-auth-info-label">{t(locale, "workspace.runtime.account")}</span>
                <span className="runtime-auth-info-value">{metadata.accountLabel}</span>
              </div>
            ) : null}
          </div>

          <label className="runtime-auth-checkbox">
            <input
              checked={setAsDefault}
              disabled={isBusy}
              onChange={(event) => {
                onChangeSetAsDefault(event.target.checked);
              }}
              type="checkbox"
            />
            <span>{t(locale, "workspace.runtime.setAsDefault")}</span>
          </label>

          <div className="runtime-auth-actions">
            <button className="runtime-auth-primary-button" disabled={isVerifying} onClick={onUseAuthorizedRuntime} type="button">
              {t(locale, "workspace.runtime.useForThread")}
            </button>
            <button className="runtime-auth-secondary-button" disabled={isVerifying} onClick={onDisconnect} type="button">
              {t(locale, "workspace.runtime.disconnect")}
            </button>
          </div>
        </div>
      ) : (
        <div className="runtime-auth-connect-panel">
          {selectedAuthMethod === "apiKey" ? (
            <>
              <input
                aria-label={t(locale, "workspace.runtime.apiKeyLabel")}
                className="runtime-auth-input"
                disabled={isBusy}
                id="runtime-api-key-input"
                onChange={(event) => {
                  onChangeApiKey(event.target.value);
                }}
                placeholder={t(locale, "workspace.runtime.apiKeyPlaceholder")}
                type="password"
                value={apiKey}
              />
            </>
          ) : selectedMethodSpec?.availability === "comingSoon" ? (
            <p className="runtime-auth-oauth-hint">{t(locale, "workspace.runtime.oauthCodexUnavailableHint")}</p>
          ) : (
            <p className="runtime-auth-oauth-hint">{getOAuthHint(locale, runtimeId, authAvailability, isOAuthPending)}</p>
          )}

          <label className="runtime-auth-checkbox">
            <input
              checked={setAsDefault}
              disabled={isBusy}
              onChange={(event) => {
                onChangeSetAsDefault(event.target.checked);
              }}
              type="checkbox"
            />
            <span>{t(locale, "workspace.runtime.setAsDefault")}</span>
          </label>

          {errorMessage ? <p className="runtime-auth-error">{errorMessage}</p> : null}

          <div className="runtime-auth-actions">
            {selectedAuthMethod === "apiKey" ? (
              <button className="runtime-auth-primary-button" disabled={isBusy} onClick={onAuthorizeApiKey} type="button">
                {t(locale, "workspace.runtime.verifyAndConnect")}
              </button>
            ) : isOAuthPending ? (
              <>
                <button className="runtime-auth-primary-button" disabled type="button">
                  {t(locale, "workspace.runtime.oauthWaiting")}
                </button>
                <button className="runtime-auth-secondary-button" disabled={isVerifying} onClick={onCancelOAuth} type="button">
                  {t(locale, "workspace.runtime.cancelOauth")}
                </button>
              </>
            ) : (
              <button
                className="runtime-auth-primary-button"
                disabled={isBusy || !isSelectedMethodAvailable}
                onClick={onAuthorizeOAuth}
                type="button"
              >
                {t(locale, "workspace.runtime.connectOauth")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
