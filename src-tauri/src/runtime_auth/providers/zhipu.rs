use reqwest::{Client, StatusCode};
use serde_json::json;

use crate::runtime_auth::error::{RuntimeAuthError, RuntimeAuthResult};

pub async fn validate_api_key(client: &Client, api_key: &str) -> RuntimeAuthResult<String> {
    let response = client
        .post("https://open.bigmodel.cn/api/paas/v4/chat/completions")
        .bearer_auth(api_key)
        .json(&json!({
            "model": "glm-4.7",
            "stream": false,
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
            "failed to reach Zhipu GLM: {error}"
        ));
    }

    RuntimeAuthError::provider_unavailable(format!("Zhipu GLM validation failed: {error}"))
}

fn map_status_error(status: StatusCode) -> RuntimeAuthError {
    match status {
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
            RuntimeAuthError::invalid_credentials("Zhipu GLM rejected the provided API key")
        }
        StatusCode::TOO_MANY_REQUESTS => {
            RuntimeAuthError::rate_limited("Zhipu GLM rate limited the validation request")
        }
        _ if status.is_server_error() => {
            RuntimeAuthError::provider_unavailable("Zhipu GLM is temporarily unavailable")
        }
        _ => RuntimeAuthError::provider_unavailable(format!(
            "Zhipu GLM returned an unexpected response ({status})"
        )),
    }
}

fn mask_api_key(api_key: &str) -> String {
    if api_key.len() <= 8 {
        return "****".to_string();
    }

    format!("{}-****{}", &api_key[..3], &api_key[api_key.len() - 4..])
}
