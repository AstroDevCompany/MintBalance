#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use tauri::{Manager, Runtime};

fn default_model_path<R: Runtime>(app: &tauri::AppHandle<R>) -> PathBuf {
    let mut path = app
        .path_resolver()
        .app_config_dir()
        .unwrap_or_else(|| PathBuf::from("."));
    path.push("models");
    path.push("MintAI.gguf");
    path
}

#[derive(serde::Serialize)]
struct ModelStatus {
    path: String,
    exists: bool,
}

#[tauri::command]
async fn llm_generate(app: tauri::AppHandle, prompt: String, model_path: Option<String>) -> Result<String, String> {
    let model_path = model_path
        .map(PathBuf::from)
        .unwrap_or_else(|| default_model_path(&app));
    if !model_path.exists() {
        return Err(format!(
            "Local model not found at {}",
            model_path.to_string_lossy()
        ));
    }

    // Placeholder: integrate llama.cpp bindings here. For now, echo the prompt to keep the pipeline flowing.
    // This keeps the app functional while allowing the UI to switch to local AI once the model is present.
    Ok(format!("(Local model placeholder) {}", prompt))
}

#[tauri::command]
async fn model_status(app: tauri::AppHandle) -> Result<ModelStatus, String> {
    let path = default_model_path(&app);
    let exists = path.exists();
    Ok(ModelStatus {
        path: path.to_string_lossy().to_string(),
        exists,
    })
}

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
        .invoke_handler(tauri::generate_handler![llm_generate, model_status])
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
