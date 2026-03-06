use crate::runtime_auth::error::RuntimeAuthError;

const RUNTIME_SECRET_SERVICE_NAME: &str = "tars.runtime";

pub trait RuntimeSecretStore {
    fn store(&self, runtime_id: &str, payload: &str) -> Result<(), String>;
    fn read(&self, runtime_id: &str) -> Result<Option<String>, String>;
    fn delete(&self, runtime_id: &str) -> Result<(), String>;
}

pub struct KeyringRuntimeSecretStore;

impl KeyringRuntimeSecretStore {
    fn entry(runtime_id: &str) -> Result<keyring::Entry, RuntimeAuthError> {
        keyring::Entry::new(RUNTIME_SECRET_SERVICE_NAME, runtime_id).map_err(|error| {
            RuntimeAuthError::secure_storage_failed(format!(
                "failed to initialize secure storage entry: {error}"
            ))
        })
    }
}

impl RuntimeSecretStore for KeyringRuntimeSecretStore {
    fn store(&self, runtime_id: &str, payload: &str) -> Result<(), String> {
        Self::entry(runtime_id)
            .map_err(|error| error.message)?
            .set_password(payload)
            .map_err(|error| format!("failed to store runtime secret: {error}"))
    }

    fn read(&self, runtime_id: &str) -> Result<Option<String>, String> {
        match Self::entry(runtime_id)
            .map_err(|error| error.message)?
            .get_password()
        {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(format!("failed to read runtime secret: {error}")),
        }
    }

    fn delete(&self, runtime_id: &str) -> Result<(), String> {
        match Self::entry(runtime_id)
            .map_err(|error| error.message)?
            .delete_credential()
        {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(format!("failed to delete runtime secret: {error}")),
        }
    }
}

pub fn validate_runtime_id(runtime_id: &str) -> Result<(), RuntimeAuthError> {
    if runtime_id.trim().is_empty() {
        return Err(RuntimeAuthError::provider_unavailable(
            "runtime_id must not be empty",
        ));
    }

    Ok(())
}

pub fn store_runtime_secret_with_store<S: RuntimeSecretStore>(
    store: &S,
    runtime_id: &str,
    payload: &str,
) -> Result<(), RuntimeAuthError> {
    validate_runtime_id(runtime_id)?;

    if payload.is_empty() {
        return Err(RuntimeAuthError::secure_storage_failed(
            "payload must not be empty",
        ));
    }

    store
        .store(runtime_id, payload)
        .map_err(RuntimeAuthError::secure_storage_failed)
}

pub fn get_runtime_secret_with_store<S: RuntimeSecretStore>(
    store: &S,
    runtime_id: &str,
) -> Result<Option<String>, RuntimeAuthError> {
    validate_runtime_id(runtime_id)?;
    store
        .read(runtime_id)
        .map_err(RuntimeAuthError::secure_storage_failed)
}

pub fn delete_runtime_secret_with_store<S: RuntimeSecretStore>(
    store: &S,
    runtime_id: &str,
) -> Result<(), RuntimeAuthError> {
    validate_runtime_id(runtime_id)?;
    store
        .delete(runtime_id)
        .map_err(RuntimeAuthError::secure_storage_failed)
}
