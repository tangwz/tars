pub mod error;
pub mod oauth_callback;
pub mod oauth_engine;
pub mod oauth_registry;
pub mod oauth_session;
pub mod providers;
pub mod secret_store;

use std::time::Duration;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::runtime_auth::error::{RuntimeAuthError, RuntimeAuthResult};
use crate::runtime_auth::oauth_engine::OAuthEngine;
use crate::runtime_auth::oauth_session::{OAuthSessionStatus, StartOAuthResult};
use crate::runtime_auth::secret_store::{
    delete_runtime_secret_with_store, store_runtime_secret_with_store, KeyringRuntimeSecretStore,
    RuntimeSecretStore,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum RuntimeId {
    Kimi,
    Codex,
    GeminiCli,
    Glm,
}

impl RuntimeId {
    pub(crate) fn as_str(&self) -> &'static str {
        match self {
            Self::Kimi => "kimi",
            Self::Codex => "codex",
            Self::GeminiCli => "gemini-cli",
            Self::Glm => "glm",
        }
    }
}

impl TryFrom<&str> for RuntimeId {
    type Error = RuntimeAuthError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "kimi" => Ok(Self::Kimi),
            "codex" => Ok(Self::Codex),
            "gemini-cli" => Ok(Self::GeminiCli),
            "glm" => Ok(Self::Glm),
            _ => Err(RuntimeAuthError::provider_unavailable(format!(
                "unsupported runtime_id: {value}"
            ))),
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AuthMethod {
    ApiKey,
    Oauth,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RuntimeAuthStatus {
    Authorized,
    Expired,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeAuthMetadata {
    pub runtime_id: String,
    pub status: RuntimeAuthStatus,
    pub auth_method: AuthMethod,
    pub verified_at: i64,
    pub expires_at: Option<i64>,
    pub account_label: Option<String>,
    pub subject_id: Option<String>,
    pub scopes: Option<Vec<String>>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeAuthCommandResult {
    pub metadata: RuntimeAuthMetadata,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeminiOAuthAppConfig {
    pub enabled: bool,
    pub client_id: String,
    pub client_secret: String,
    pub scopes: Vec<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeAuthAppConfig {
    #[serde(rename = "geminiOAuth")]
    pub gemini_oauth: GeminiOAuthAppConfig,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSecretStatus {
    pub runtime_id: String,
    pub exists: bool,
    pub expires_at: Option<i64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeAuthAvailability {
    pub api_key: Option<&'static str>,
    pub oauth: Option<&'static str>,
    pub reason: Option<&'static str>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub(crate) enum RuntimeSecretPayload {
    ApiKey {
        version: u8,
        provider: String,
        api_key: String,
        verified_at: i64,
    },
    Oauth {
        version: u8,
        provider: String,
        access_token: String,
        refresh_token: Option<String>,
        expires_at: Option<i64>,
        subject_id: Option<String>,
        scopes: Option<Vec<String>>,
        account_label: Option<String>,
    },
}

pub(crate) fn now_millis() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

pub fn load_runtime_auth_app_config() -> RuntimeAuthAppConfig {
    serde_json::from_str(include_str!("../../gen/runtime-auth.json"))
        .expect("failed to parse bundled runtime auth config")
}

fn http_client() -> RuntimeAuthResult<Client> {
    Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|error| RuntimeAuthError::provider_unavailable(format!("failed to build HTTP client: {error}")))
}

async fn validate_api_key(runtime_id: RuntimeId, api_key: &str) -> RuntimeAuthResult<String> {
    let client = http_client()?;

    match runtime_id {
        RuntimeId::Kimi => providers::moonshot::validate_api_key(&client, api_key).await,
        RuntimeId::Codex => providers::openai::validate_api_key(&client, api_key).await,
        RuntimeId::GeminiCli => providers::google::validate_api_key(&client, api_key).await,
        RuntimeId::Glm => providers::zhipu::validate_api_key(&client, api_key).await,
    }
}

fn provider_name(runtime_id: RuntimeId) -> &'static str {
    match runtime_id {
        RuntimeId::Kimi => "moonshot",
        RuntimeId::Codex => "openai",
        RuntimeId::GeminiCli => "google",
        RuntimeId::Glm => "zhipu",
    }
}

async fn authorize_runtime_with_store<S: RuntimeSecretStore>(
    store: &S,
    runtime_id: RuntimeId,
    api_key: &str,
) -> RuntimeAuthResult<RuntimeAuthCommandResult> {
    if api_key.trim().is_empty() {
        return Err(RuntimeAuthError::invalid_credentials(
            "API key must not be empty",
        ));
    }

    let account_label = validate_api_key(runtime_id, api_key).await?;
    let verified_at = now_millis();
    let payload = RuntimeSecretPayload::ApiKey {
        version: 2,
        provider: provider_name(runtime_id).to_string(),
        api_key: api_key.to_string(),
        verified_at,
    };

    let payload_json = serde_json::to_string(&payload).map_err(|error| {
        RuntimeAuthError::secure_storage_failed(format!(
            "failed to serialize runtime secret payload: {error}"
        ))
    })?;

    store_runtime_secret_with_store(store, runtime_id.as_str(), &payload_json)?;

    Ok(RuntimeAuthCommandResult {
        metadata: RuntimeAuthMetadata {
            runtime_id: runtime_id.as_str().to_string(),
            status: RuntimeAuthStatus::Authorized,
            auth_method: AuthMethod::ApiKey,
            verified_at,
            expires_at: None,
            account_label: Some(account_label),
            subject_id: None,
            scopes: None,
        },
    })
}

#[tauri::command]
pub async fn authorize_runtime_with_api_key(
    runtime_id: String,
    api_key: String,
) -> RuntimeAuthResult<RuntimeAuthCommandResult> {
    let runtime_id = RuntimeId::try_from(runtime_id.as_str())?;
    authorize_runtime_with_store(&KeyringRuntimeSecretStore, runtime_id, api_key.trim()).await
}

#[tauri::command]
pub async fn get_runtime_secret_statuses(
    runtime_ids: Vec<String>,
    oauth_engine: State<'_, OAuthEngine>,
) -> RuntimeAuthResult<Vec<RuntimeSecretStatus>> {
    let runtime_ids = runtime_ids
        .iter()
        .map(|runtime_id| RuntimeId::try_from(runtime_id.as_str()))
        .collect::<RuntimeAuthResult<Vec<_>>>()?;

    oauth_engine.get_secret_statuses(runtime_ids).await
}

#[tauri::command]
pub async fn get_runtime_auth_availability(
    oauth_engine: State<'_, OAuthEngine>,
) -> RuntimeAuthResult<std::collections::HashMap<String, RuntimeAuthAvailability>> {
    Ok(oauth_engine.get_runtime_auth_availability().await)
}

#[tauri::command]
pub async fn start_runtime_oauth(
    runtime_id: String,
    oauth_engine: State<'_, OAuthEngine>,
) -> RuntimeAuthResult<StartOAuthResult> {
    let runtime_id = RuntimeId::try_from(runtime_id.as_str())?;
    oauth_engine.start_session(runtime_id).await
}

#[tauri::command]
pub async fn poll_runtime_oauth_session(
    session_id: String,
    oauth_engine: State<'_, OAuthEngine>,
) -> RuntimeAuthResult<OAuthSessionStatus> {
    oauth_engine.poll_session(&session_id).await
}

#[tauri::command]
pub async fn cancel_runtime_oauth(
    session_id: String,
    oauth_engine: State<'_, OAuthEngine>,
) -> RuntimeAuthResult<()> {
    oauth_engine.cancel_session(&session_id).await
}

#[tauri::command]
pub fn revoke_runtime_auth(runtime_id: String) -> RuntimeAuthResult<()> {
    let runtime_id = RuntimeId::try_from(runtime_id.as_str())?;
    delete_runtime_secret_with_store(&KeyringRuntimeSecretStore, runtime_id.as_str())
}
