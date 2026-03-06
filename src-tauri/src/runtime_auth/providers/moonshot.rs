use reqwest::{Client, StatusCode};
use serde_json::json;

use crate::runtime_auth::error::{RuntimeAuthError, RuntimeAuthResult};

pub async fn validate_api_key(client: &Client, api_key: &str) -> RuntimeAuthResult<String> {
    let response = client
        .post("https://api.moonshot.cn/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&json!({
            "model": "moonshot-v1-8k",
            "max_tokens": 1,
            "messages": [
                {"role": "user", "content": "ping"}
            ]
        }))
        .send()
        .await
        .map_err(map_transport_error)?;

    match response.status() {
        StatusCode::OK => Ok(mask_api_key(api_key)),
        status => Err(map_status_error(status)),
    }
}

fn map_transport_error(error: reqwest::Error) -> RuntimeAuthError {
    if error.is_timeout() || error.is_connect() {
        return RuntimeAuthError::network_unreachable(format!(
            "failed to reach Moonshot: {error}"
        ));
    }

    RuntimeAuthError::provider_unavailable(format!("Moonshot validation failed: {error}"))
}

fn map_status_error(status: StatusCode) -> RuntimeAuthError {
    match status {
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
            RuntimeAuthError::invalid_credentials("Moonshot rejected the provided API key")
        }
        StatusCode::TOO_MANY_REQUESTS => {
            RuntimeAuthError::rate_limited("Moonshot rate limited the validation request")
        }
        _ if status.is_server_error() => {
            RuntimeAuthError::provider_unavailable("Moonshot is temporarily unavailable")
        }
        _ => RuntimeAuthError::provider_unavailable(format!(
            "Moonshot returned an unexpected response ({status})"
        )),
    }
}

fn mask_api_key(api_key: &str) -> String {
    if api_key.len() <= 8 {
        return "****".to_string();
    }

    format!("{}-****{}", &api_key[..3], &api_key[api_key.len() - 4..])
}
