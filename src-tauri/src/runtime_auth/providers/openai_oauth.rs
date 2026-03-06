use async_trait::async_trait;

use crate::runtime_auth::error::{RuntimeAuthError, RuntimeAuthResult};
use crate::runtime_auth::oauth_registry::RuntimeOAuthAdapter;
use crate::runtime_auth::oauth_session::{CompletedOAuthAuthorization, StartedOAuthSession};
use crate::runtime_auth::{RuntimeAuthAppConfig, RuntimeId, RuntimeSecretPayload};

pub(crate) struct OpenAIOAuthAdapter {
    runtime_id: RuntimeId,
}

impl OpenAIOAuthAdapter {
    pub fn new() -> Self {
        Self {
            runtime_id: RuntimeId::Codex,
        }
    }

    pub fn unsupported(runtime_id: RuntimeId) -> Self {
        Self { runtime_id }
    }

    fn unsupported_error(&self) -> RuntimeAuthError {
        RuntimeAuthError::unsupported_auth_method(format!(
            "{} OAuth is not enabled in this build yet",
            self.runtime_id.as_str()
        ))
    }
}

#[async_trait]
impl RuntimeOAuthAdapter for OpenAIOAuthAdapter {
    fn runtime_id(&self) -> &'static str {
        self.runtime_id.as_str()
    }

    fn start(
        &self,
        _app_config: &RuntimeAuthAppConfig,
        _session_id: &str,
        _redirect_url: &str,
    ) -> RuntimeAuthResult<StartedOAuthSession> {
        Err(self.unsupported_error())
    }

    async fn exchange_code(
        &self,
        _app_config: &RuntimeAuthAppConfig,
        _code: &str,
        _pkce_verifier: &str,
        _redirect_url: &str,
    ) -> RuntimeAuthResult<CompletedOAuthAuthorization> {
        Err(self.unsupported_error())
    }

    async fn refresh_secret(
        &self,
        _app_config: &RuntimeAuthAppConfig,
        _secret: &RuntimeSecretPayload,
    ) -> RuntimeAuthResult<Option<RuntimeSecretPayload>> {
        Err(self.unsupported_error())
    }
}

#[cfg(test)]
mod tests {
    use super::OpenAIOAuthAdapter;
    use crate::runtime_auth::oauth_registry::RuntimeOAuthAdapter;

    #[test]
    fn keeps_codex_oauth_disabled() {
        let adapter = OpenAIOAuthAdapter::new();
        let error = adapter
            .start(
                &crate::runtime_auth::load_runtime_auth_app_config(),
                "session",
                "http://127.0.0.1:9000/oauth/callback",
            )
            .unwrap_err();
        assert_eq!(
            error.code,
            crate::runtime_auth::error::RuntimeAuthErrorCode::UnsupportedAuthMethod
        );
    }
}
