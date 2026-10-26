// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// High-speed 5-Axis Inverse Kinematics command in Rust
#[tauri::command]
fn solve_5axis_kinematics(x: f64, y: f64, z: f64, i: f64, j: f64, k: f64) -> Result<String, String> {
    // Calculates B-tilt and C-rotary angles for DMU 50 table kinematics
    let b_angle = (k.acos()).to_degrees();
    let c_angle = (j.atan2(i)).to_degrees();
    Ok(format!(
        "{{\"x\": {}, \"y\": {}, \"z\": {}, \"b\": {:.3}, \"c\": {:.3}}}",
        x, y, z, b_angle, c_angle
    ))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![solve_5axis_kinematics])
        .run(tauri::generate_context!())
        .expect("error while running Argus CAM desktop application");
}
