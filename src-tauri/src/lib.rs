#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_sql::Builder::default().build());

    #[cfg(debug_assertions)]
    let builder = {
        let bind_host = std::env::var("TARS_MCP_BIND_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

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
