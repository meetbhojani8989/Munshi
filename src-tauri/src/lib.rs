#[cfg(not(debug_assertions))]
static SERVER: std::sync::OnceLock<std::sync::Mutex<std::process::Child>> = std::sync::OnceLock::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run(){
  tauri::Builder::default()
    .setup(|app|{
      #[cfg(debug_assertions)]
      let _ = app;
      #[cfg(not(debug_assertions))]
      {
        use tauri::Manager;
        let resource=app.path().resource_dir()?;
        let data=app.path().app_data_dir()?;
        std::fs::create_dir_all(&data)?;
        let server=resource.join("server");
        let child=std::process::Command::new("node")
          .arg(server.join("server.js"))
          .current_dir(&server)
          .env("HOSTNAME","127.0.0.1")
          .env("PORT","3417")
          .env("AUTH_URL","http://127.0.0.1:3417")
          .env("MUNSHI_DATA_FILE",data.join("businesses.json"))
          .spawn()?;
        let _=SERVER.set(std::sync::Mutex::new(child));
        std::thread::sleep(std::time::Duration::from_secs(1));
      }
      Ok(())
    })
    .on_window_event(|_,event|{
      #[cfg(not(debug_assertions))]
      if matches!(event,tauri::WindowEvent::Destroyed){
        if let Some(server)=SERVER.get(){if let Ok(mut child)=server.lock(){let _=child.kill();}}
      }
      #[cfg(debug_assertions)]
      let _=event;
    })
    .run(tauri::generate_context!())
    .expect("error running Munshi desktop");
}
