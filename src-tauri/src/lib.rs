use mouse_position::mouse_position::Mouse;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;

const SETTINGS_FILE: &str = "settings.json";
const DEFAULT_SHORTCUT: &str = "Command+Option+N";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub shortcut: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            shortcut: DEFAULT_SHORTCUT.to_string(),
        }
    }
}

#[tauri::command]
fn get_settings(app: AppHandle) -> Settings {
    let store = app.store(SETTINGS_FILE).expect("Failed to access store");
    
    match store.get("settings") {
        Some(value) => serde_json::from_value(value.clone()).unwrap_or_default(),
        None => Settings::default(),
    }
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let store = app.store(SETTINGS_FILE).map_err(|e| e.to_string())?;
    store
        .set("settings", serde_json::to_value(&settings).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())?;
    
    // Re-register shortcut with new key
    let _ = register_shortcut(&app, &settings.shortcut);
    
    Ok(())
}

#[tauri::command]
fn capture_memory(content: String) -> Result<(), String> {
    // TODO: Implement actual backend call
    println!("Capturing memory: {}", content);
    Ok(())
}

#[tauri::command]
fn close_quick_capture(app: AppHandle) {
    if let Some(window) = app.get_webview_window("quick-capture") {
        let _ = window.close();
    }
}

fn get_mouse_position() -> (i32, i32) {
    match Mouse::get_mouse_position() {
        Mouse::Position { x, y } => (x, y),
        Mouse::Error => (100, 100), // Fallback position
    }
}

fn show_quick_capture_window(app: &AppHandle) {
    let (mouse_x, mouse_y) = get_mouse_position();
    
    // Check if window already exists
    if let Some(window) = app.get_webview_window("quick-capture") {
        // Move to cursor position and show
        let _ = window.set_position(tauri::PhysicalPosition::new(mouse_x - 190, mouse_y - 28));
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }
    
    // Create new window at cursor position
    let window = WebviewWindowBuilder::new(
        app,
        "quick-capture",
        WebviewUrl::App("quick-capture".into()),
    )
    .title("")
    .inner_size(380.0, 56.0)
    .position((mouse_x - 190) as f64, (mouse_y - 28) as f64)
    .decorations(false)
    .resizable(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .focused(true)
    .transparent(true)
    .build();
    
    match window {
        Ok(win) => {
            let _ = win.set_focus();
        }
        Err(e) => {
            eprintln!("Failed to create quick capture window: {}", e);
        }
    }
}

fn register_shortcut(app: &AppHandle, shortcut_str: &str) -> Result<(), String> {
    // Unregister all existing shortcuts first
    let _ = app.global_shortcut().unregister_all();
    
    // Parse the shortcut string
    let shortcut = parse_shortcut(shortcut_str)?;
    
    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                show_quick_capture_window(&app_handle);
            }
        })
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

fn parse_shortcut(shortcut_str: &str) -> Result<Shortcut, String> {
    let parts: Vec<&str> = shortcut_str.split('+').collect();
    let mut modifiers = Modifiers::empty();
    let mut key_code = None;
    
    for part in parts {
        match part.trim().to_lowercase().as_str() {
            "command" | "cmd" | "super" | "meta" => modifiers |= Modifiers::SUPER,
            "control" | "ctrl" => modifiers |= Modifiers::CONTROL,
            "alt" | "option" => modifiers |= Modifiers::ALT,
            "shift" => modifiers |= Modifiers::SHIFT,
            key => {
                key_code = Some(parse_key_code(key)?);
            }
        }
    }
    
    let code = key_code.ok_or("No key specified in shortcut")?;
    Ok(Shortcut::new(Some(modifiers), code))
}

fn parse_key_code(key: &str) -> Result<Code, String> {
    match key.to_uppercase().as_str() {
        "A" => Ok(Code::KeyA),
        "B" => Ok(Code::KeyB),
        "C" => Ok(Code::KeyC),
        "D" => Ok(Code::KeyD),
        "E" => Ok(Code::KeyE),
        "F" => Ok(Code::KeyF),
        "G" => Ok(Code::KeyG),
        "H" => Ok(Code::KeyH),
        "I" => Ok(Code::KeyI),
        "J" => Ok(Code::KeyJ),
        "K" => Ok(Code::KeyK),
        "L" => Ok(Code::KeyL),
        "M" => Ok(Code::KeyM),
        "N" => Ok(Code::KeyN),
        "O" => Ok(Code::KeyO),
        "P" => Ok(Code::KeyP),
        "Q" => Ok(Code::KeyQ),
        "R" => Ok(Code::KeyR),
        "S" => Ok(Code::KeyS),
        "T" => Ok(Code::KeyT),
        "U" => Ok(Code::KeyU),
        "V" => Ok(Code::KeyV),
        "W" => Ok(Code::KeyW),
        "X" => Ok(Code::KeyX),
        "Y" => Ok(Code::KeyY),
        "Z" => Ok(Code::KeyZ),
        "0" => Ok(Code::Digit0),
        "1" => Ok(Code::Digit1),
        "2" => Ok(Code::Digit2),
        "3" => Ok(Code::Digit3),
        "4" => Ok(Code::Digit4),
        "5" => Ok(Code::Digit5),
        "6" => Ok(Code::Digit6),
        "7" => Ok(Code::Digit7),
        "8" => Ok(Code::Digit8),
        "9" => Ok(Code::Digit9),
        "SPACE" => Ok(Code::Space),
        "ENTER" => Ok(Code::Enter),
        "ESCAPE" | "ESC" => Ok(Code::Escape),
        _ => Err(format!("Unknown key: {}", key)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            capture_memory,
            close_quick_capture
        ])
        .setup(|app| {
            // Load settings and register shortcut
            let settings = {
                let store = app.store(SETTINGS_FILE)?;
                match store.get("settings") {
                    Some(value) => serde_json::from_value(value.clone()).unwrap_or_default(),
                    None => Settings::default(),
                }
            };
            
            if let Err(e) = register_shortcut(app.handle(), &settings.shortcut) {
                eprintln!("Failed to register shortcut: {}", e);
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
