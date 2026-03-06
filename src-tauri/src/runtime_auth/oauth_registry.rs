use async_trait::async_trait;

use crate::runtime_auth::error::RuntimeAuthResult;
use crate::runtime_auth::oauth_session::{CompletedOAuthAuthorization, StartedOAuthSession};
use crate::runtime_auth::providers::{google_oauth::GoogleOAuthAdapter, openai_oauth::OpenAIOAuthAdapter};
use crate::runtime_auth::{RuntimeAuthAppConfig, RuntimeId, RuntimeSecretPayload};

#[async_trait]
pub(crate) trait RuntimeOAuthAdapter: Send + Sync {
    fn runtime_id(&self) -> &'static str;

    fn start(
        &self,
        app_config: &RuntimeAuthAppConfig,
        session_id: &str,
        redirect_url: &str,
    ) -> RuntimeAuthResult<StartedOAuthSession>;

    async fn exchange_code(
        &self,
        app_config: &RuntimeAuthAppConfig,
        code: &str,
        pkce_verifier: &str,
        redirect_url: &str,
    ) -> RuntimeAuthResult<CompletedOAuthAuthorization>;

    async fn refresh_secret(
        &self,
        _app_config: &RuntimeAuthAppConfig,
        _secret: &RuntimeSecretPayload,
    ) -> RuntimeAuthResult<Option<RuntimeSecretPayload>> {
        Ok(None)
    }
}

pub(crate) fn oauth_adapter(runtime_id: RuntimeId) -> Box<dyn RuntimeOAuthAdapter> {
    match runtime_id {
        RuntimeId::GeminiCli => Box::new(GoogleOAuthAdapter::new()),
        RuntimeId::Codex => Box::new(OpenAIOAuthAdapter::new()),
        RuntimeId::Kimi | RuntimeId::Glm => Box::new(OpenAIOAuthAdapter::unsupported(runtime_id)),
    }
}
