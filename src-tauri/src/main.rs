#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_window("main") {
                if let Some(icon_path) = app.path_resolver().resolve_resource("icons/icon.png") {
                    let _ = window.set_icon(tauri::Icon::File(icon_path));
                }
            }
            Ok(())
        })
        .on_page_load(|window, _payload| {
            let _ = window.eval(
                r#"
              window.addEventListener('contextmenu', (e) => e.preventDefault());
              window.addEventListener('keydown', (e) => {
                const key = e.key?.toLowerCase();
                const combo = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || key === 'c' || key === 'j');
                if (combo || key === 'f12') {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }, true);
            "#,
            );
        })
        .run(tauri::generate_context!())
        .expect("failed to run MintBalance application");
}
