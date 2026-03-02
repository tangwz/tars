const RUNTIME_SECRET_SERVICE_NAME: &str = "tars.runtime";

trait RuntimeSecretStore {
    fn store(&self, runtime_id: &str, payload: &str) -> Result<(), String>;
    fn read(&self, runtime_id: &str) -> Result<Option<String>, String>;
    fn delete(&self, runtime_id: &str) -> Result<(), String>;
}

struct KeyringRuntimeSecretStore;

impl KeyringRuntimeSecretStore {
    fn entry(runtime_id: &str) -> Result<keyring::Entry, String> {
        keyring::Entry::new(RUNTIME_SECRET_SERVICE_NAME, runtime_id)
            .map_err(|error| format!("failed to initialize secure storage entry: {error}"))
    }
}

impl RuntimeSecretStore for KeyringRuntimeSecretStore {
    fn store(&self, runtime_id: &str, payload: &str) -> Result<(), String> {
        Self::entry(runtime_id)?
            .set_password(payload)
            .map_err(|error| format!("failed to store runtime secret: {error}"))
    }

    fn read(&self, runtime_id: &str) -> Result<Option<String>, String> {
        match Self::entry(runtime_id)?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(format!("failed to read runtime secret: {error}")),
        }
    }

    fn delete(&self, runtime_id: &str) -> Result<(), String> {
        match Self::entry(runtime_id)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(format!("failed to delete runtime secret: {error}")),
        }
    }
}

fn validate_runtime_id(runtime_id: &str) -> Result<(), String> {
    if runtime_id.trim().is_empty() {
        return Err("runtime_id must not be empty".to_string());
    }

    Ok(())
}

fn store_runtime_secret_with_store<S: RuntimeSecretStore>(
    store: &S,
    runtime_id: &str,
    payload: &str,
) -> Result<(), String> {
    validate_runtime_id(runtime_id)?;

    if payload.is_empty() {
        return Err("payload must not be empty".to_string());
    }

    store.store(runtime_id, payload)
}

fn get_runtime_secret_with_store<S: RuntimeSecretStore>(
    store: &S,
    runtime_id: &str,
) -> Result<Option<String>, String> {
    validate_runtime_id(runtime_id)?;
    store.read(runtime_id)
}

fn delete_runtime_secret_with_store<S: RuntimeSecretStore>(
    store: &S,
    runtime_id: &str,
) -> Result<(), String> {
    validate_runtime_id(runtime_id)?;
    store.delete(runtime_id)
}

#[tauri::command]
fn store_runtime_secret(runtime_id: String, payload: String) -> Result<(), String> {
    store_runtime_secret_with_store(&KeyringRuntimeSecretStore, &runtime_id, &payload)
}

#[tauri::command]
fn get_runtime_secret(runtime_id: String) -> Result<Option<String>, String> {
    get_runtime_secret_with_store(&KeyringRuntimeSecretStore, &runtime_id)
}

#[tauri::command]
fn delete_runtime_secret(runtime_id: String) -> Result<(), String> {
    delete_runtime_secret_with_store(&KeyringRuntimeSecretStore, &runtime_id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            store_runtime_secret,
            get_runtime_secret,
            delete_runtime_secret
        ]);

    #[cfg(debug_assertions)]
    let builder = {
        let bind_host =
            std::env::var("TARS_MCP_BIND_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

        builder.plugin(
            tauri_plugin_mcp_bridge::Builder::new()
                .bind_address(&bind_host)
                .build(),
        )
    };

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{
        delete_runtime_secret_with_store, get_runtime_secret_with_store,
        store_runtime_secret_with_store, RuntimeSecretStore,
    };
    use std::cell::RefCell;
    use std::collections::HashMap;

    #[derive(Default)]
    struct MockRuntimeSecretStore {
        values: RefCell<HashMap<String, String>>,
        fail: bool,
    }

    impl RuntimeSecretStore for MockRuntimeSecretStore {
        fn store(&self, runtime_id: &str, payload: &str) -> Result<(), String> {
            if self.fail {
                return Err("secure storage unavailable".to_string());
            }

            self.values
                .borrow_mut()
                .insert(runtime_id.to_string(), payload.to_string());
            Ok(())
        }

        fn read(&self, runtime_id: &str) -> Result<Option<String>, String> {
            if self.fail {
                return Err("secure storage unavailable".to_string());
            }

            Ok(self.values.borrow().get(runtime_id).cloned())
        }

        fn delete(&self, runtime_id: &str) -> Result<(), String> {
            if self.fail {
                return Err("secure storage unavailable".to_string());
            }

            self.values.borrow_mut().remove(runtime_id);
            Ok(())
        }
    }

    #[test]
    fn stores_and_reads_runtime_secret() {
        let store = MockRuntimeSecretStore::default();

        store_runtime_secret_with_store(&store, "codex", "payload").unwrap();

        assert_eq!(
            get_runtime_secret_with_store(&store, "codex").unwrap(),
            Some("payload".to_string())
        );
    }

    #[test]
    fn deletes_runtime_secret() {
        let store = MockRuntimeSecretStore::default();

        store_runtime_secret_with_store(&store, "codex", "payload").unwrap();
        delete_runtime_secret_with_store(&store, "codex").unwrap();

        assert_eq!(
            get_runtime_secret_with_store(&store, "codex").unwrap(),
            None
        );
    }

    #[test]
    fn returns_error_when_storage_backend_fails() {
        let store = MockRuntimeSecretStore {
            fail: true,
            ..Default::default()
        };

        let error = store_runtime_secret_with_store(&store, "codex", "payload").unwrap_err();

        assert!(error.contains("secure storage unavailable"));
    }

    #[test]
    fn rejects_empty_runtime_id() {
        let store = MockRuntimeSecretStore::default();
        let error = get_runtime_secret_with_store(&store, "").unwrap_err();

        assert!(error.contains("runtime_id must not be empty"));
    }
}
