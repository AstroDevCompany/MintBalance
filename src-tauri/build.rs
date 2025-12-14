fn main() {
    // Ensure the dist directory exists so tauri-build doesn't panic when the SPA hasn't been built yet.
    // This avoids proc-macro errors during plain `cargo check` or IDE analysis; real builds should still
    // run `npm run build` to populate the assets.
    let dist_dir = std::path::Path::new("..").join("dist");
    if !dist_dir.exists() {
        let _ = std::fs::create_dir_all(&dist_dir);
        let _ = std::fs::write(dist_dir.join(".placeholder"), b"Run `npm run build` to generate UI assets.");
    }
    tauri_build::build()
}
