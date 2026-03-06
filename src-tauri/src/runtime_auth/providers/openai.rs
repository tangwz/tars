use reqwest::{Client, StatusCode};

use crate::runtime_auth::error::{RuntimeAuthError, RuntimeAuthResult};

pub async fn validate_api_key(client: &Client, api_key: &str) -> RuntimeAuthResult<String> {
    let response = client
        .get("https://api.openai.com/v1/models")
        .bearer_auth(api_key)
        .send()
        .await
        .map_err(map_transport_error)?;

    match response.status() {
        StatusCode::OK => Ok(mask_api_key(api_key)),
        status => Err(map_status_error(status, "OpenAI")),
    }
}

fn map_transport_error(error: reqwest::Error) -> RuntimeAuthError {
    if error.is_timeout() || error.is_connect() {
        return RuntimeAuthError::network_unreachable(format!(
            "failed to reach OpenAI: {error}"
        ));
    }

    RuntimeAuthError::provider_unavailable(format!("OpenAI validation failed: {error}"))
}

fn map_status_error(status: StatusCode, provider_name: &str) -> RuntimeAuthError {
    match status {
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
            RuntimeAuthError::invalid_credentials(format!(
                "{provider_name} rejected the provided API key"
            ))
        }
        StatusCode::TOO_MANY_REQUESTS => RuntimeAuthError::rate_limited(format!(
            "{provider_name} rate limited the validation request"
        )),
        _ if status.is_server_error() => RuntimeAuthError::provider_unavailable(format!(
            "{provider_name} is temporarily unavailable"
        )),
        _ => RuntimeAuthError::provider_unavailable(format!(
            "{provider_name} returned an unexpected response ({status})"
        )),
    }
}

fn mask_api_key(api_key: &str) -> String {
    if api_key.len() <= 8 {
        return "****".to_string();
    }

    format!("{}-****{}", &api_key[..3], &api_key[api_key.len() - 4..])
}

#[cfg(test)]
mod tests {
    use super::map_status_error;
    use reqwest::StatusCode;

    #[test]
    fn maps_unauthorized_to_invalid_credentials() {
        let error = map_status_error(StatusCode::UNAUTHORIZED, "OpenAI");
        assert_eq!(error.code, crate::runtime_auth::error::RuntimeAuthErrorCode::InvalidCredentials);
    }
}
