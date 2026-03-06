use async_trait::async_trait;
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge,
    PkceCodeVerifier, RedirectUrl, RefreshToken, Scope, TokenResponse, TokenUrl,
};
use reqwest::Client;
use serde::Deserialize;

use crate::runtime_auth::error::{RuntimeAuthError, RuntimeAuthResult};
use crate::runtime_auth::oauth_registry::RuntimeOAuthAdapter;
use crate::runtime_auth::oauth_session::{CompletedOAuthAuthorization, StartedOAuthSession};
use crate::runtime_auth::{
    now_millis, AuthMethod, GeminiOAuthAppConfig, RuntimeAuthAppConfig, RuntimeAuthMetadata,
    RuntimeAuthStatus, RuntimeSecretPayload,
};

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL: &str = "https://openidconnect.googleapis.com/v1/userinfo";
const OAUTH_SESSION_TTL_MILLIS: i64 = 5 * 60 * 1000;
const BUILD_NOT_CONFIGURED_ERROR: &str = "Gemini OAuth is not configured in this build";

#[derive(Debug, Deserialize)]
struct GoogleUserInfo {
    sub: String,
    email: Option<String>,
}

pub(crate) struct GoogleOAuthAdapter;

impl GoogleOAuthAdapter {
    pub fn new() -> Self {
        Self
    }

    fn config<'a>(
        app_config: &'a RuntimeAuthAppConfig,
    ) -> RuntimeAuthResult<&'a GeminiOAuthAppConfig> {
        let config = &app_config.gemini_oauth;

        if !config.enabled
            || config.client_id.trim().is_empty()
            || config.client_secret.trim().is_empty()
            || config.scopes.is_empty()
        {
            return Err(RuntimeAuthError::provider_unavailable(
                BUILD_NOT_CONFIGURED_ERROR,
            ));
        }

        Ok(config)
    }

    fn auth_url() -> RuntimeAuthResult<AuthUrl> {
        AuthUrl::new(GOOGLE_AUTH_URL.to_string()).map_err(|error| {
            RuntimeAuthError::provider_unavailable(format!("invalid Google auth URL: {error}"))
        })
    }

    fn token_url() -> RuntimeAuthResult<TokenUrl> {
        TokenUrl::new(GOOGLE_TOKEN_URL.to_string()).map_err(|error| {
            RuntimeAuthError::provider_unavailable(format!("invalid Google token URL: {error}"))
        })
    }

    fn redirect_url(value: &str) -> RuntimeAuthResult<RedirectUrl> {
        RedirectUrl::new(value.to_string()).map_err(|error| {
            RuntimeAuthError::provider_unavailable(format!("invalid Google redirect URL: {error}"))
        })
    }

    fn http_client() -> RuntimeAuthResult<Client> {
        Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .map_err(|error| {
                RuntimeAuthError::provider_unavailable(format!(
                    "failed to create Google OAuth HTTP client: {error}"
                ))
            })
    }

    fn map_token_error(error: impl std::fmt::Display) -> RuntimeAuthError {
        let message = error.to_string();

        if message.contains("invalid_grant") {
            return RuntimeAuthError::expired_credentials("Google OAuth refresh token is no longer valid");
        }

        RuntimeAuthError::provider_unavailable(format!("Google OAuth token exchange failed: {message}"))
    }

    async fn fetch_user_info(http_client: &Client, access_token: &str) -> RuntimeAuthResult<GoogleUserInfo> {
        let response = http_client
            .get(GOOGLE_USERINFO_URL)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|error| {
                if error.is_connect() || error.is_timeout() {
                    RuntimeAuthError::network_unreachable(format!(
                        "failed to reach Google userinfo endpoint: {error}"
                    ))
                } else {
                    RuntimeAuthError::provider_unavailable(format!(
                        "Google userinfo request failed: {error}"
                    ))
                }
            })?;

        let status = response.status();
        if !status.is_success() {
            return Err(match status.as_u16() {
                401 | 403 => RuntimeAuthError::invalid_credentials(
                    "Google rejected the OAuth access token",
                ),
                429 => RuntimeAuthError::rate_limited(
                    "Google rate limited the OAuth userinfo request",
                ),
                _ if status.is_server_error() => {
                    RuntimeAuthError::provider_unavailable("Google userinfo endpoint is temporarily unavailable")
                }
                _ => RuntimeAuthError::provider_unavailable(format!(
                    "Google userinfo endpoint returned an unexpected response ({status})"
                )),
            });
        }

        response.json::<GoogleUserInfo>().await.map_err(|error| {
            RuntimeAuthError::provider_unavailable(format!(
                "failed to parse Google userinfo response: {error}"
            ))
        })
    }

    #[cfg(test)]
    pub(crate) fn build_authorization_url_for_redirect(
        redirect_url: &str,
        session_id: &str,
        scopes: &[String],
    ) -> RuntimeAuthResult<String> {
        let client = oauth2::basic::BasicClient::new(ClientId::new("test-client-id".to_string()))
            .set_client_secret(ClientSecret::new("test-client-secret".to_string()))
            .set_auth_uri(Self::auth_url()?)
            .set_token_uri(Self::token_url()?)
            .set_redirect_uri(Self::redirect_url(redirect_url)?);
        let (pkce_challenge, _) = PkceCodeChallenge::new_random_sha256();
        let mut auth_request = client
            .authorize_url(|| CsrfToken::new(format!("oauth-state-{session_id}")))
            .set_pkce_challenge(pkce_challenge)
            .add_extra_param("access_type", "offline")
            .add_extra_param("prompt", "consent");

        for scope in scopes {
            auth_request = auth_request.add_scope(Scope::new(scope.clone()));
        }

        let (url, _) = auth_request.url();
        Ok(url.to_string())
    }
}

#[async_trait]
impl RuntimeOAuthAdapter for GoogleOAuthAdapter {
    fn runtime_id(&self) -> &'static str {
        "gemini-cli"
    }

    fn start(
        &self,
        app_config: &RuntimeAuthAppConfig,
        _session_id: &str,
        redirect_url: &str,
    ) -> RuntimeAuthResult<StartedOAuthSession> {
        let config = Self::config(app_config)?;
        let client = oauth2::basic::BasicClient::new(ClientId::new(config.client_id.clone()))
            .set_client_secret(ClientSecret::new(config.client_secret.clone()))
            .set_auth_uri(Self::auth_url()?)
            .set_token_uri(Self::token_url()?)
            .set_redirect_uri(Self::redirect_url(redirect_url)?);
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        let mut auth_request = client
            .authorize_url(CsrfToken::new_random)
            .set_pkce_challenge(pkce_challenge)
            .add_extra_param("access_type", "offline")
            .add_extra_param("prompt", "consent");

        for scope in &config.scopes {
            auth_request = auth_request.add_scope(Scope::new(scope.clone()));
        }

        let (authorization_url, csrf_state) = auth_request.url();

        Ok(StartedOAuthSession {
            authorization_url: authorization_url.to_string(),
            state: csrf_state.secret().to_string(),
            pkce_verifier: pkce_verifier.secret().to_string(),
            expires_at: now_millis() + OAUTH_SESSION_TTL_MILLIS,
        })
    }

    async fn exchange_code(
        &self,
        app_config: &RuntimeAuthAppConfig,
        code: &str,
        pkce_verifier: &str,
        redirect_url: &str,
    ) -> RuntimeAuthResult<CompletedOAuthAuthorization> {
        let config = Self::config(app_config)?;
        let client = oauth2::basic::BasicClient::new(ClientId::new(config.client_id.clone()))
            .set_client_secret(ClientSecret::new(config.client_secret.clone()))
            .set_auth_uri(Self::auth_url()?)
            .set_token_uri(Self::token_url()?)
            .set_redirect_uri(Self::redirect_url(redirect_url)?);
        let http_client = Self::http_client()?;
        let token_response = client
            .exchange_code(AuthorizationCode::new(code.to_string()))
            .set_pkce_verifier(PkceCodeVerifier::new(pkce_verifier.to_string()))
            .request_async(&http_client)
            .await
            .map_err(Self::map_token_error)?;

        let access_token = token_response.access_token().secret().to_string();
        let refresh_token = token_response
            .refresh_token()
            .map(|token| token.secret().to_string());
        let expires_at = token_response
            .expires_in()
            .map(|duration| now_millis() + duration.as_millis() as i64);
        let scopes = token_response.scopes().map(|items| {
            items
                .iter()
                .map(|scope| scope.to_string())
                .collect::<Vec<_>>()
        });
        let user_info = Self::fetch_user_info(&http_client, &access_token).await?;
        let verified_at = now_millis();
        let account_label = user_info.email.clone();

        let payload = RuntimeSecretPayload::Oauth {
            version: 2,
            provider: "google".to_string(),
            access_token,
            refresh_token,
            expires_at,
            subject_id: Some(user_info.sub.clone()),
            scopes: scopes.clone(),
            account_label: account_label.clone(),
        };

        Ok(CompletedOAuthAuthorization {
            payload,
            metadata: RuntimeAuthMetadata {
                runtime_id: self.runtime_id().to_string(),
                status: RuntimeAuthStatus::Authorized,
                auth_method: AuthMethod::Oauth,
                verified_at,
                expires_at,
                account_label,
                subject_id: Some(user_info.sub),
                scopes,
            },
        })
    }

    async fn refresh_secret(
        &self,
        app_config: &RuntimeAuthAppConfig,
        secret: &RuntimeSecretPayload,
    ) -> RuntimeAuthResult<Option<RuntimeSecretPayload>> {
        let RuntimeSecretPayload::Oauth {
            provider,
            refresh_token,
            subject_id,
            scopes,
            account_label,
            ..
        } = secret
        else {
            return Ok(None);
        };

        if provider != "google" {
            return Ok(None);
        }

        let Some(refresh_token_value) = refresh_token.clone() else {
            return Ok(None);
        };

        let config = Self::config(app_config)?;
        let client = oauth2::basic::BasicClient::new(ClientId::new(config.client_id.clone()))
            .set_client_secret(ClientSecret::new(config.client_secret.clone()))
            .set_auth_uri(Self::auth_url()?)
            .set_token_uri(Self::token_url()?)
            .set_redirect_uri(Self::redirect_url("http://127.0.0.1/unused")?);
        let http_client = Self::http_client()?;
        let token_response = client
            .exchange_refresh_token(&RefreshToken::new(refresh_token_value.clone()))
            .request_async(&http_client)
            .await
            .map_err(Self::map_token_error)?;

        let next_access_token = token_response.access_token().secret().to_string();
        let next_refresh_token = token_response
            .refresh_token()
            .map(|token| token.secret().to_string())
            .or(Some(refresh_token_value));
        let next_expires_at = token_response
            .expires_in()
            .map(|duration| now_millis() + duration.as_millis() as i64);
        let next_scopes = token_response.scopes().map(|items| {
            items
                .iter()
                .map(|scope| scope.to_string())
                .collect::<Vec<_>>()
        });

        Ok(Some(RuntimeSecretPayload::Oauth {
            version: 2,
            provider: "google".to_string(),
            access_token: next_access_token,
            refresh_token: next_refresh_token,
            expires_at: next_expires_at,
            subject_id: subject_id.clone(),
            scopes: next_scopes.or_else(|| scopes.clone()),
            account_label: account_label.clone(),
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::GoogleOAuthAdapter;

    #[test]
    fn builds_google_authorization_url() {
        let scopes = vec!["openid".to_string(), "email".to_string(), "profile".to_string()];
        let url = GoogleOAuthAdapter::build_authorization_url_for_redirect(
            "http://127.0.0.1:43123/oauth/callback",
            "session-1",
            &scopes,
        )
        .unwrap();

        assert!(url.starts_with("https://accounts.google.com/o/oauth2/v2/auth"));
        assert!(url.contains("redirect_uri=http%3A%2F%2F127.0.0.1%3A43123%2Foauth%2Fcallback"));
    }

    #[test]
    fn refresh_error_maps_invalid_grant_to_expired_credentials() {
        let error = GoogleOAuthAdapter::map_token_error("invalid_grant");
        assert_eq!(error.code, crate::runtime_auth::error::RuntimeAuthErrorCode::ExpiredCredentials);
    }

    #[test]
    fn rejects_missing_bundled_config() {
        let app_config = crate::runtime_auth::RuntimeAuthAppConfig {
            gemini_oauth: crate::runtime_auth::GeminiOAuthAppConfig {
                enabled: false,
                client_id: String::new(),
                client_secret: String::new(),
                scopes: vec![],
            },
        };

        let error = GoogleOAuthAdapter::config(&app_config).unwrap_err();
        assert_eq!(error.message, "Gemini OAuth is not configured in this build");
    }
}
