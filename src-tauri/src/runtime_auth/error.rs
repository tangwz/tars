use serde::Serialize;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RuntimeAuthErrorCode {
    InvalidCredentials,
    ExpiredCredentials,
    NetworkUnreachable,
    ProviderUnavailable,
    RateLimited,
    OauthCancelled,
    OauthTimeout,
    SecureStorageFailed,
    UnsupportedAuthMethod,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeAuthError {
    pub code: RuntimeAuthErrorCode,
    pub message: String,
    pub recoverable: bool,
}

impl RuntimeAuthError {
    pub fn invalid_credentials(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::InvalidCredentials,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn expired_credentials(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::ExpiredCredentials,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn network_unreachable(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::NetworkUnreachable,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn provider_unavailable(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::ProviderUnavailable,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn rate_limited(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::RateLimited,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn oauth_cancelled(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::OauthCancelled,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn oauth_timeout(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::OauthTimeout,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn secure_storage_failed(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::SecureStorageFailed,
            message: message.into(),
            recoverable: false,
        }
    }

    pub fn unsupported_auth_method(message: impl Into<String>) -> Self {
        Self {
            code: RuntimeAuthErrorCode::UnsupportedAuthMethod,
            message: message.into(),
            recoverable: false,
        }
    }
}

pub type RuntimeAuthResult<T> = Result<T, RuntimeAuthError>;
