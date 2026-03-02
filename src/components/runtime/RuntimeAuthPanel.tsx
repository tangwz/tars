import { getRuntimeCatalogItem } from "@/features/runtime/runtimeCatalog";
import type { AuthMethod, RuntimeAuthMetadata, RuntimeId } from "@/features/runtime/runtimeTypes";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";

interface RuntimeAuthPanelProps {
  locale: Locale;
  runtimeId: RuntimeId;
  metadata?: RuntimeAuthMetadata;
  selectedAuthMethod: AuthMethod;
  apiKey: string;
  setAsDefault: boolean;
  isVerifying: boolean;
  errorMessage: string;
  onChangeAuthMethod: (authMethod: AuthMethod) => void;
  onChangeApiKey: (value: string) => void;
  onChangeSetAsDefault: (value: boolean) => void;
  onAuthorizeApiKey: () => void;
  onAuthorizeOAuth: () => void;
  onUseAuthorizedRuntime: () => void;
  onDisconnect: () => void;
}

export function RuntimeAuthPanel(props: RuntimeAuthPanelProps) {
  const {
    locale,
    runtimeId,
    metadata,
    selectedAuthMethod,
    apiKey,
    setAsDefault,
    isVerifying,
    errorMessage,
    onChangeAuthMethod,
    onChangeApiKey,
    onChangeSetAsDefault,
    onAuthorizeApiKey,
    onAuthorizeOAuth,
    onUseAuthorizedRuntime,
    onDisconnect,
  } = props;
  const runtime = getRuntimeCatalogItem(runtimeId);
  const isAuthorized = metadata?.status === "authorized";

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

      {runtime.authMethods.length > 1 ? (
        <div className="runtime-auth-methods" role="group">
          {runtime.authMethods.map((method) => (
            <button
              className={`runtime-auth-method-chip${selectedAuthMethod === method ? " is-active" : ""}`}
              key={method}
              onClick={() => {
                onChangeAuthMethod(method);
              }}
              type="button"
            >
              {t(locale, method === "apiKey" ? "workspace.runtime.authMethodApiKey" : "workspace.runtime.authMethodOauth")}
            </button>
          ))}
        </div>
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
              <label className="runtime-auth-input-label" htmlFor="runtime-api-key-input">
                {t(locale, "workspace.runtime.apiKeyLabel")}
              </label>
              <input
                className="runtime-auth-input"
                id="runtime-api-key-input"
                onChange={(event) => {
                  onChangeApiKey(event.target.value);
                }}
                placeholder={t(locale, "workspace.runtime.apiKeyPlaceholder")}
                type="password"
                value={apiKey}
              />
            </>
          ) : (
            <p className="runtime-auth-oauth-hint">{t(locale, "workspace.runtime.oauthHint")}</p>
          )}

          <label className="runtime-auth-checkbox">
            <input
              checked={setAsDefault}
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
              <button className="runtime-auth-primary-button" disabled={isVerifying} onClick={onAuthorizeApiKey} type="button">
                {t(locale, "workspace.runtime.verifyAndConnect")}
              </button>
            ) : (
              <button className="runtime-auth-primary-button" disabled={isVerifying} onClick={onAuthorizeOAuth} type="button">
                {t(locale, "workspace.runtime.connectOauth")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
