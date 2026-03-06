use std::collections::HashMap;
use std::sync::Arc;

use axum::{routing::get, Router};
use tokio::net::TcpListener;
use tokio::sync::{oneshot, Mutex};
use uuid::Uuid;

use crate::runtime_auth::error::{RuntimeAuthError, RuntimeAuthResult};
use crate::runtime_auth::oauth_callback::{oauth_callback_handler, OAuthCallbackState};
use crate::runtime_auth::oauth_registry::oauth_adapter;
use crate::runtime_auth::oauth_session::{
    InternalOAuthSessionState, OAuthSessionRecord, OAuthSessionStatus, PendingOAuthSession,
    StartOAuthResult,
};
use crate::runtime_auth::secret_store::{
    get_runtime_secret_with_store, store_runtime_secret_with_store, KeyringRuntimeSecretStore,
};
use crate::runtime_auth::{
    now_millis, RuntimeAuthAppConfig, RuntimeAuthAvailability, RuntimeId, RuntimeSecretPayload,
    RuntimeSecretStatus,
};

pub(crate) struct OAuthEngineInner {
    sessions: Mutex<HashMap<String, OAuthSessionRecord>>,
    app_config: Arc<RuntimeAuthAppConfig>,
}

#[derive(Clone)]
pub struct OAuthEngine {
    inner: Arc<OAuthEngineInner>,
}

impl OAuthEngine {
    pub fn new(app_config: RuntimeAuthAppConfig) -> Self {
        Self {
            inner: Arc::new(OAuthEngineInner {
                sessions: Mutex::new(HashMap::new()),
                app_config: Arc::new(app_config),
            }),
        }
    }

    pub async fn start_session(&self, runtime_id: RuntimeId) -> RuntimeAuthResult<StartOAuthResult> {
        self.inner
            .start_session(runtime_id, Arc::clone(&self.inner))
            .await
    }

    pub async fn poll_session(&self, session_id: &str) -> RuntimeAuthResult<OAuthSessionStatus> {
        self.inner.poll_session(session_id).await
    }

    pub async fn cancel_session(&self, session_id: &str) -> RuntimeAuthResult<()> {
        self.inner.cancel_session(session_id).await
    }

    pub async fn get_secret_statuses(
        &self,
        runtime_ids: Vec<RuntimeId>,
    ) -> RuntimeAuthResult<Vec<RuntimeSecretStatus>> {
        self.inner.get_secret_statuses(runtime_ids).await
    }

    pub async fn get_runtime_auth_availability(&self) -> HashMap<String, RuntimeAuthAvailability> {
        self.inner.get_runtime_auth_availability().await
    }
}

impl OAuthEngineInner {
    pub async fn get_runtime_auth_availability(&self) -> HashMap<String, RuntimeAuthAvailability> {
        let mut availability = HashMap::from([
            (
                "kimi".to_string(),
                RuntimeAuthAvailability {
                    api_key: Some("available"),
                    oauth: Some("unavailable"),
                    reason: None,
                },
            ),
            (
                "codex".to_string(),
                RuntimeAuthAvailability {
                    api_key: Some("available"),
                    oauth: Some("unavailable"),
                    reason: None,
                },
            ),
            (
                "glm".to_string(),
                RuntimeAuthAvailability {
                    api_key: Some("available"),
                    oauth: Some("unavailable"),
                    reason: None,
                },
            ),
        ]);
        let gemini_oauth = &self.app_config.gemini_oauth;
        let gemini_oauth_enabled = gemini_oauth.enabled
            && !gemini_oauth.client_id.trim().is_empty()
            && !gemini_oauth.client_secret.trim().is_empty()
            && !gemini_oauth.scopes.is_empty();

        availability.insert(
            "gemini-cli".to_string(),
            RuntimeAuthAvailability {
                api_key: Some("available"),
                oauth: Some(if gemini_oauth_enabled {
                    "available"
                } else {
                    "unavailable"
                }),
                reason: if gemini_oauth_enabled {
                    None
                } else {
                    Some("build_not_configured")
                },
            },
        );

        availability
    }

    pub async fn start_session(
        &self,
        runtime_id: RuntimeId,
        engine_handle: Arc<OAuthEngineInner>,
    ) -> RuntimeAuthResult<StartOAuthResult> {
        let session_id = Uuid::new_v4().to_string();
        let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|error| {
            RuntimeAuthError::provider_unavailable(format!(
                "failed to bind OAuth callback server: {error}"
            ))
        })?;
        let address = listener.local_addr().map_err(|error| {
            RuntimeAuthError::provider_unavailable(format!(
                "failed to inspect OAuth callback server address: {error}"
            ))
        })?;
        let redirect_url = format!("http://127.0.0.1:{}/oauth/callback", address.port());
        let adapter = oauth_adapter(runtime_id);
        let started = adapter.start(&self.app_config, &session_id, &redirect_url)?;
        let (shutdown_tx, shutdown_rx) = oneshot::channel();

        {
            let mut sessions = self.sessions.lock().await;
            sessions.insert(
                session_id.clone(),
                OAuthSessionRecord {
                    state: InternalOAuthSessionState::Pending(PendingOAuthSession {
                        runtime_id,
                        redirect_url: redirect_url.clone(),
                        state: started.state.clone(),
                        pkce_verifier: started.pkce_verifier.clone(),
                        expires_at: started.expires_at,
                        opened_browser_at: None,
                    }),
                    shutdown_tx: Some(shutdown_tx),
                },
            );
        }

        let router = Router::new()
            .route("/oauth/callback", get(oauth_callback_handler))
            .with_state(OAuthCallbackState {
                engine: engine_handle,
                session_id: session_id.clone(),
            });

        tokio::spawn(async move {
            let _ = axum::serve(listener, router)
                .with_graceful_shutdown(async move {
                    let _ = shutdown_rx.await;
                })
                .await;
        });

        if let Err(error) = tauri_plugin_opener::open_url(started.authorization_url.clone(), None::<&str>) {
            let error = RuntimeAuthError::provider_unavailable(format!(
                "failed to open browser for OAuth: {error}"
            ));
            self.set_terminal_state(&session_id, InternalOAuthSessionState::Failed(error.clone()))
                .await;
            return Err(error);
        }

        {
            let mut sessions = self.sessions.lock().await;
            if let Some(record) = sessions.get_mut(&session_id) {
                if let InternalOAuthSessionState::Pending(session) = &mut record.state {
                    session.opened_browser_at = Some(now_millis());
                }
            }
        }

        Ok(StartOAuthResult {
            session_id,
            authorization_url: Some(started.authorization_url),
        })
    }

    pub async fn poll_session(&self, session_id: &str) -> RuntimeAuthResult<OAuthSessionStatus> {
        if session_id.trim().is_empty() {
            return Err(RuntimeAuthError::oauth_timeout("missing OAuth session id"));
        }

        self.expire_if_needed(session_id).await;

        let sessions = self.sessions.lock().await;
        let Some(record) = sessions.get(session_id) else {
            return Err(RuntimeAuthError::oauth_timeout("OAuth session was not found"));
        };

        Ok(record.state.to_public_status())
    }

    pub async fn cancel_session(&self, session_id: &str) -> RuntimeAuthResult<()> {
        if session_id.trim().is_empty() {
            return Err(RuntimeAuthError::oauth_cancelled("missing OAuth session id"));
        }

        self.set_terminal_state(session_id, InternalOAuthSessionState::Cancelled)
            .await;
        Ok(())
    }

    pub async fn complete_session_from_callback(
        &self,
        session_id: &str,
        params: &HashMap<String, String>,
    ) -> RuntimeAuthResult<()> {
        let pending = self.pending_session(session_id).await?;

        if pending.expires_at <= now_millis() {
            self.set_terminal_state(session_id, InternalOAuthSessionState::TimedOut)
                .await;
            return Err(RuntimeAuthError::oauth_timeout("OAuth session timed out"));
        }

        if let Some(error_code) = params.get("error") {
            let error_state = if error_code == "access_denied" {
                InternalOAuthSessionState::Cancelled
            } else {
                let description = params
                    .get("error_description")
                    .cloned()
                    .unwrap_or_else(|| error_code.clone());
                InternalOAuthSessionState::Failed(RuntimeAuthError::provider_unavailable(
                    format!("OAuth provider returned an error: {description}"),
                ))
            };

            self.set_terminal_state(session_id, error_state).await;
            return Err(RuntimeAuthError::oauth_cancelled(
                "OAuth flow did not complete successfully",
            ));
        }

        let Some(returned_state) = params.get("state") else {
            let error = RuntimeAuthError::provider_unavailable("missing OAuth state parameter");
            self.set_terminal_state(session_id, InternalOAuthSessionState::Failed(error.clone()))
                .await;
            return Err(error);
        };

        if returned_state != &pending.state {
            let error = RuntimeAuthError::provider_unavailable("OAuth state mismatch");
            self.set_terminal_state(session_id, InternalOAuthSessionState::Failed(error.clone()))
                .await;
            return Err(error);
        }

        let Some(code) = params.get("code") else {
            let error = RuntimeAuthError::provider_unavailable("missing OAuth authorization code");
            self.set_terminal_state(session_id, InternalOAuthSessionState::Failed(error.clone()))
                .await;
            return Err(error);
        };

        let adapter = oauth_adapter(pending.runtime_id);
        let completed = match adapter
            .exchange_code(
                &self.app_config,
                code,
                &pending.pkce_verifier,
                &pending.redirect_url,
            )
            .await
        {
            Ok(result) => result,
            Err(error) => {
                self.set_terminal_state(session_id, InternalOAuthSessionState::Failed(error.clone()))
                    .await;
                return Err(error);
            }
        };

        let payload_json = serde_json::to_string(&completed.payload).map_err(|error| {
            RuntimeAuthError::secure_storage_failed(format!(
                "failed to serialize OAuth secret payload: {error}"
            ))
        })?;

        if let Err(error) = store_runtime_secret_with_store(
            &KeyringRuntimeSecretStore,
            pending.runtime_id.as_str(),
            &payload_json,
        ) {
            self.set_terminal_state(session_id, InternalOAuthSessionState::Failed(error.clone()))
                .await;
            return Err(error);
        }

        self.set_terminal_state(
            session_id,
            InternalOAuthSessionState::Succeeded(completed.metadata),
        )
        .await;

        Ok(())
    }

    pub async fn get_secret_statuses(
        &self,
        runtime_ids: Vec<RuntimeId>,
    ) -> RuntimeAuthResult<Vec<RuntimeSecretStatus>> {
        let mut results = Vec::with_capacity(runtime_ids.len());

        for runtime_id in runtime_ids {
            let secret = get_runtime_secret_with_store(&KeyringRuntimeSecretStore, runtime_id.as_str())?;
            let mut exists = secret.is_some();
            let mut expires_at = None;

            if let Some(payload_json) = secret {
                if let Ok(payload) = serde_json::from_str::<RuntimeSecretPayload>(&payload_json) {
                    let active_payload = match self.refresh_oauth_secret_if_needed(runtime_id, &payload).await {
                        Ok(Some(next_payload)) => {
                            let next_payload_json = serde_json::to_string(&next_payload).map_err(|error| {
                                RuntimeAuthError::secure_storage_failed(format!(
                                    "failed to serialize refreshed OAuth payload: {error}"
                                ))
                            })?;
                            store_runtime_secret_with_store(
                                &KeyringRuntimeSecretStore,
                                runtime_id.as_str(),
                                &next_payload_json,
                            )?;
                            next_payload
                        }
                        Ok(None) | Err(_) => payload,
                    };

                    if let RuntimeSecretPayload::Oauth { expires_at: payload_expires_at, .. } = active_payload {
                        expires_at = payload_expires_at;
                    }
                }
            } else {
                exists = false;
            }

            results.push(RuntimeSecretStatus {
                runtime_id: runtime_id.as_str().to_string(),
                exists,
                expires_at,
            });
        }

        Ok(results)
    }

    async fn refresh_oauth_secret_if_needed(
        &self,
        runtime_id: RuntimeId,
        payload: &RuntimeSecretPayload,
    ) -> RuntimeAuthResult<Option<RuntimeSecretPayload>> {
        let RuntimeSecretPayload::Oauth { expires_at, .. } = payload else {
            return Ok(None);
        };

        let Some(expires_at) = expires_at else {
            return Ok(None);
        };

        if *expires_at > now_millis() {
            return Ok(None);
        }

        oauth_adapter(runtime_id)
            .refresh_secret(&self.app_config, payload)
            .await
    }

    async fn pending_session(&self, session_id: &str) -> RuntimeAuthResult<PendingOAuthSession> {
        let sessions = self.sessions.lock().await;
        let Some(record) = sessions.get(session_id) else {
            return Err(RuntimeAuthError::oauth_timeout("OAuth session was not found"));
        };

        let InternalOAuthSessionState::Pending(session) = &record.state else {
            return Err(RuntimeAuthError::oauth_timeout(
                "OAuth session is no longer waiting for a callback",
            ));
        };

        Ok(session.clone())
    }

    async fn expire_if_needed(&self, session_id: &str) {
        let should_expire = {
            let sessions = self.sessions.lock().await;
            matches!(
                sessions.get(session_id).map(|record| &record.state),
                Some(InternalOAuthSessionState::Pending(session)) if session.expires_at <= now_millis()
            )
        };

        if should_expire {
            self.set_terminal_state(session_id, InternalOAuthSessionState::TimedOut)
                .await;
        }
    }

    async fn set_terminal_state(&self, session_id: &str, next_state: InternalOAuthSessionState) {
        let shutdown_tx = {
            let mut sessions = self.sessions.lock().await;
            let Some(record) = sessions.get_mut(session_id) else {
                return;
            };

            if !matches!(record.state, InternalOAuthSessionState::Pending(_)) {
                return;
            }

            record.state = next_state;
            record.shutdown_tx.take()
        };

        if let Some(shutdown_tx) = shutdown_tx {
            let _ = shutdown_tx.send(());
        }
    }
}

#[cfg(test)]
mod tests {
    use tokio::sync::oneshot;

    use super::OAuthEngine;
    use crate::runtime_auth::oauth_session::{InternalOAuthSessionState, OAuthSessionRecord, PendingOAuthSession};
    use crate::runtime_auth::RuntimeId;

    #[tokio::test]
    async fn cancels_pending_sessions() {
        let engine = OAuthEngine::new(crate::runtime_auth::load_runtime_auth_app_config());
        let (shutdown_tx, _shutdown_rx) = oneshot::channel();
        engine
            .inner
            .sessions
            .lock()
            .await
            .insert(
                "session-1".to_string(),
                OAuthSessionRecord {
                    state: InternalOAuthSessionState::Pending(PendingOAuthSession {
                        runtime_id: RuntimeId::GeminiCli,
                        redirect_url: "http://127.0.0.1:9999/oauth/callback".to_string(),
                        state: "state-1".to_string(),
                        pkce_verifier: "verifier-1".to_string(),
                        expires_at: crate::runtime_auth::now_millis() + 1_000,
                        opened_browser_at: Some(crate::runtime_auth::now_millis()),
                    }),
                    shutdown_tx: Some(shutdown_tx),
                },
            );

        engine.cancel_session("session-1").await.unwrap();

        let sessions = engine.inner.sessions.lock().await;
        let record = sessions.get("session-1").unwrap();
        assert!(matches!(record.state, InternalOAuthSessionState::Cancelled));
    }

    #[tokio::test]
    async fn times_out_expired_pending_sessions_on_poll() {
        let engine = OAuthEngine::new(crate::runtime_auth::load_runtime_auth_app_config());
        let (shutdown_tx, _shutdown_rx) = oneshot::channel();
        engine
            .inner
            .sessions
            .lock()
            .await
            .insert(
                "session-2".to_string(),
                OAuthSessionRecord {
                    state: InternalOAuthSessionState::Pending(PendingOAuthSession {
                        runtime_id: RuntimeId::GeminiCli,
                        redirect_url: "http://127.0.0.1:9998/oauth/callback".to_string(),
                        state: "state-2".to_string(),
                        pkce_verifier: "verifier-2".to_string(),
                        expires_at: crate::runtime_auth::now_millis() - 1,
                        opened_browser_at: None,
                    }),
                    shutdown_tx: Some(shutdown_tx),
                },
            );

        let status = engine.poll_session("session-2").await.unwrap();
        assert!(matches!(
            status,
            crate::runtime_auth::oauth_session::OAuthSessionStatus::TimedOut
        ));
    }

    #[tokio::test]
    async fn reports_gemini_oauth_as_unavailable_without_bundled_config() {
        let engine = OAuthEngine::new(crate::runtime_auth::load_runtime_auth_app_config());

        let availability = engine.get_runtime_auth_availability().await;

        assert_eq!(
            availability.get("gemini-cli").and_then(|item| item.oauth),
            Some("unavailable")
        );
        assert_eq!(
            availability.get("gemini-cli").and_then(|item| item.reason),
            Some("build_not_configured")
        );
    }
}
