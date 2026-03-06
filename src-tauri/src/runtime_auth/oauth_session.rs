use tokio::sync::oneshot;
use serde::Serialize;

use crate::runtime_auth::error::RuntimeAuthError;
use crate::runtime_auth::{RuntimeAuthMetadata, RuntimeId, RuntimeSecretPayload};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartOAuthResult {
    pub session_id: String,
    pub authorization_url: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "state", rename_all = "snake_case")]
pub enum OAuthSessionStatus {
    Pending { opened_browser_at: Option<i64> },
    Succeeded { metadata: RuntimeAuthMetadata },
    Failed { error: RuntimeAuthError },
    Cancelled,
    TimedOut,
}

#[derive(Clone, Debug)]
pub(crate) struct StartedOAuthSession {
    pub authorization_url: String,
    pub state: String,
    pub pkce_verifier: String,
    pub expires_at: i64,
}

#[derive(Clone, Debug)]
pub(crate) struct CompletedOAuthAuthorization {
    pub payload: RuntimeSecretPayload,
    pub metadata: RuntimeAuthMetadata,
}

#[derive(Clone, Debug)]
pub(crate) struct PendingOAuthSession {
    pub runtime_id: RuntimeId,
    pub redirect_url: String,
    pub state: String,
    pub pkce_verifier: String,
    pub expires_at: i64,
    pub opened_browser_at: Option<i64>,
}

#[derive(Clone, Debug)]
pub(crate) enum InternalOAuthSessionState {
    Pending(PendingOAuthSession),
    Succeeded(RuntimeAuthMetadata),
    Failed(RuntimeAuthError),
    Cancelled,
    TimedOut,
}

impl InternalOAuthSessionState {
    pub fn to_public_status(&self) -> OAuthSessionStatus {
        match self {
            Self::Pending(session) => OAuthSessionStatus::Pending {
                opened_browser_at: session.opened_browser_at,
            },
            Self::Succeeded(metadata) => OAuthSessionStatus::Succeeded {
                metadata: metadata.clone(),
            },
            Self::Failed(error) => OAuthSessionStatus::Failed {
                error: error.clone(),
            },
            Self::Cancelled => OAuthSessionStatus::Cancelled,
            Self::TimedOut => OAuthSessionStatus::TimedOut,
        }
    }
}

#[derive(Debug)]
pub(crate) struct OAuthSessionRecord {
    pub state: InternalOAuthSessionState,
    pub shutdown_tx: Option<oneshot::Sender<()>>,
}
