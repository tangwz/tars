use std::collections::HashMap;
use std::sync::Arc;

use axum::extract::{Query, State};
use axum::response::Html;

use crate::runtime_auth::oauth_engine::OAuthEngineInner;

#[derive(Clone)]
pub(crate) struct OAuthCallbackState {
    pub engine: Arc<OAuthEngineInner>,
    pub session_id: String,
}

pub(crate) async fn oauth_callback_handler(
    State(state): State<OAuthCallbackState>,
    Query(params): Query<HashMap<String, String>>,
) -> Html<&'static str> {
    let result = state
        .engine
        .complete_session_from_callback(&state.session_id, &params)
        .await;

    match result {
        Ok(()) => Html(
            r#"<!doctype html><html><body><h1>Connected</h1><p>You can return to Tars now.</p></body></html>"#,
        ),
        Err(_) => Html(
            r#"<!doctype html><html><body><h1>Connection failed</h1><p>You can close this window and retry from Tars.</p></body></html>"#,
        ),
    }
}
