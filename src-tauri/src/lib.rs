mod runtime_auth;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let runtime_auth_app_config = runtime_auth::load_runtime_auth_app_config();
    let builder = tauri::Builder::default()
        .manage(runtime_auth_app_config.clone())
        .manage(runtime_auth::oauth_engine::OAuthEngine::new(
            runtime_auth_app_config,
        ))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            runtime_auth::authorize_runtime_with_api_key,
            runtime_auth::get_runtime_secret_statuses,
            runtime_auth::get_runtime_auth_availability,
            runtime_auth::start_runtime_oauth,
            runtime_auth::poll_runtime_oauth_session,
            runtime_auth::cancel_runtime_oauth,
            runtime_auth::revoke_runtime_auth
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
