
var SETTINGS_DICT = {};
var settings_changed = false;

function settings_change(e) {
  if (e.target.id.split("_")[2] == "thame") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = e.target.id.split("_")[3];
  } else if (e.target.id.split("_")[2] == "readyTimeout") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = Math.abs(document.getElementById(e.target.id).value);
  } else if (e.target.id.split("_")[2] == "maxCacheData") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = Math.abs(document.getElementById(e.target.id).value);
  } else {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = document.getElementById(e.target.id).checked;
  }
  settings_changed = true;
  document.getElementById("settings_save_button").className = "button save";
}

var first_get_config_flag = true;
ipcRenderer.on('get-config-response', (event, response) => {
  SETTINGS_DICT = response;

  if (first_get_config_flag) {
    set_thame(SETTINGS_DICT["General"]["thame"]);
    read();
    first_get_config_flag = false;
  }
});

ipcRenderer.on('get-system-thame-response', (event, response) => {
  set_thame(response.thame);
});

function set_thame(thame) {
  document.documentElement.setAttribute('data-theme', thame);
}

function get_config() {
  ipcRenderer.send('get-config');
}

function save_settings() {
  if (settings_changed) {
    ipcRenderer.send('update-config', SETTINGS_DICT);
    ipcRenderer.send('relaunch');
  }
}


function alert_settings() {
  open_alert(`
    <p class="name_settings">Settings</p>
    <hr class="hr_settings">
    <div class="settings_body scroll_style block_select" onchange="settings_change(event)">
      <p class="settings_h">General</p>

      <div class="checkbox" for="settings_General_autoStart">
        <input type="checkbox" id="settings_General_autoStart">
        <label for="settings_General_autoStart">Start sRemote when you sign in to your computer</label>
      </div>

      <div class="checkbox" for="settings_General_keepBackground">
        <input type="checkbox" id="settings_General_keepBackground">
        <label for="settings_General_keepBackground">Keep sRemote running in the background</label>
      </div>

      <div class="checkbox" for="settings_General_saveWindowState">
        <input type="checkbox" id="settings_General_saveWindowState">
        <label for="settings_General_saveWindowState">Save window position on exit</label>
      </div>

      <p class="info_settings">Choose theme for sRemote</p>
      <div class="settings_one_line">
        <div class="checkbox-round" for="settings_General_thame_light">
          <input type="radio" id="settings_General_thame_light" name="thame">
          <label for="settings_General_thame_light">Light</label>
        </div>
        <div class="checkbox-round" for="settings_General_thame_dark">
          <input type="radio" id="settings_General_thame_dark" name="thame">
          <label for="settings_General_thame_dark">Dark</label>
        </div>
      </div>


      <!-- <input type="radio" id="settings_General_thame_system">
      <label for="settings_General_thame_system">Use system settings</label> -->

      <p class="settings_h">Connections</p>

      <div class="checkbox" for="settings_Connections_autoConnect">
        <input type="checkbox" id="settings_Connections_autoConnect">
        <label for="settings_Connections_autoConnect">Automatically connect to all networks upon application startup</label>
      </div>

      <div class="number">
        <input type="number" class="input_style" id="settings_Connections_readyTimeout">
        <label for="settings_Connections_readyTimeout">How long (in milliseconds) to wait for the SSH handshake to complete.</label>
      </div>

      <div class="checkbox" for="settings_Connections_cacheData">
        <input type="checkbox" id="settings_Connections_cacheData">
        <label for="settings_Connections_cacheData">Cache data from the terminal</label>
      </div>

      <div class="number">
        <input type="number" class="input_style" id="settings_Connections_maxCacheData">
        <label for="settings_Connections_maxCacheData">Terminal cache size (in bytes).</label>
      </div>

    </div>
    <div class="settings_buttons_bar">
      <div id="settings_save_button" class="not_active_button save" onclick="save_settings()">
        <p>Apply</p>
      </div>
    </div>
  `, "settings_alert", function() {get_config()});

  document.getElementById("settings_General_autoStart").checked = SETTINGS_DICT["General"]["autoStart"];
  document.getElementById("settings_General_keepBackground").checked = SETTINGS_DICT["General"]["keepBackground"];
  document.getElementById("settings_General_saveWindowState").checked = SETTINGS_DICT["General"]["saveWindowState"];

  document.getElementById("settings_General_thame_light").checked = SETTINGS_DICT["General"]["thame"] == "light";
  document.getElementById("settings_General_thame_dark").checked = SETTINGS_DICT["General"]["thame"] == "dark";
  // document.getElementById("settings_General_thame_system").checked = SETTINGS_DICT["General"]["thame"] == "system";

  document.getElementById("settings_Connections_autoConnect").checked = SETTINGS_DICT["Connections"]["autoConnect"];
  document.getElementById("settings_Connections_readyTimeout").value = SETTINGS_DICT["Connections"]["readyTimeout"];
  document.getElementById("settings_Connections_cacheData").checked = SETTINGS_DICT["Connections"]["cacheData"];
  document.getElementById("settings_Connections_maxCacheData").value = SETTINGS_DICT["Connections"]["maxCacheData"];
}

get_config();
// alert_settings();
