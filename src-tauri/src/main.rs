#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::sync::Mutex;

use llama_cpp::{standard_sampler::StandardSampler, LlamaModel, LlamaParams, SessionParams};
use once_cell::sync::OnceCell;
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

static MODEL: OnceCell<Mutex<LlamaModel>> = OnceCell::new();

fn get_model(path: &PathBuf) -> Result<&'static Mutex<LlamaModel>, String> {
    MODEL.get_or_try_init(|| {
        let params = LlamaParams::default();
        LlamaModel::load_from_file(path, params)
            .map(Mutex::new)
            .map_err(|e| e.to_string())
    })
}

#[derive(serde::Serialize)]
struct ModelStatus {
    path: String,
    exists: bool,
}

#[tauri::command]
async fn llm_generate(
    app: tauri::AppHandle,
    prompt: String,
    model_path: Option<String>,
) -> Result<String, String> {
    let model_path = model_path
        .map(PathBuf::from)
        .unwrap_or_else(|| default_model_path(&app));

    if !model_path.exists() {
        return Err(format!(
            "Local model not found at {}",
            model_path.to_string_lossy()
        ));
    }

    let model = get_model(&model_path)?;
    let guard = model.lock().map_err(|e| e.to_string())?;

    let mut session = guard
        .create_session(SessionParams::default())
        .map_err(|e| e.to_string())?;

    session.advance_context(prompt.as_bytes()).map_err(|e| e.to_string())?;

    let mut completions = session
        .start_completing_with(StandardSampler::default(), 256)
        .map_err(|e| e.to_string())?
        .into_strings();

    let mut output = String::new();
    for token in completions.by_ref().take(256) {
        output.push_str(&token);
        if output.len() > 8000 {
            break;
        }
    }

    if output.trim().is_empty() {
        return Err("Local model returned empty output.".to_string());
    }

    Ok(output)
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
