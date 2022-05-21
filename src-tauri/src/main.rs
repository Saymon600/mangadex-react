#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{window::WindowBuilder, WindowUrl};
use tauri_plugin_store::PluginBuilder;

fn main() {
    let port = portpicker::pick_unused_port().expect("failed to find unused port"); 
    tauri::Builder::default()
        .plugin(PluginBuilder::default().build())
        .plugin(tauri_plugin_localhost::Builder::new(port).build())
        .setup(move |app| {
            WindowBuilder::new(
              app,
              "main".to_string(),
              WindowUrl::External(format!("http://localhost:{}", port).parse().unwrap()),
            )
            .title("MangaDex")
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
