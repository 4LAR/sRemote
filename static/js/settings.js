
var SETTINGS_DICT = {};
var settings_changed = false;

function settings_change(e) {
  if (e.target.id.split("_")[1] == "account") {
    return;
  } else if (e.target.id.split("_")[1] == "macros") {
    return;
  } else if (e.target.id.split("_")[2] == "thame") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = e.target.id.split("_")[3];
  } else if (e.target.id.split("_")[2] == "readyTimeout") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = Math.abs(document.getElementById(e.target.id).value);
  } else if (e.target.id.split("_")[2] == "maxCacheData") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = Math.abs(document.getElementById(e.target.id).value);
  } else if (e.target.id.split("_")[2] == "readyTimeout") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = Math.abs(document.getElementById(e.target.id).value);
  } else if (e.target.id.split("_")[2] == "keepaliveCountMax") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = Math.abs(document.getElementById(e.target.id).value);
  } else if (e.target.id.split("_")[2] == "keepaliveInterval") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = Math.abs(document.getElementById(e.target.id).value);
  } else if (e.target.tagName == "SELECT") {
    SETTINGS_DICT[e.target.id.split("_")[1]][e.target.id.split("_")[2]] = document.getElementById(e.target.id).value;
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
    set_thame(SETTINGS_DICT["Appearance"]["thame"]);
    read_localization(SETTINGS_DICT["General"]["lang"]);
    read();
    first_get_config_flag = false;

    if ((os.platform() !== "win32") || (SETTINGS_DICT["Appearance"]["defaultTitleBar"])) {
      root.style.setProperty('--titleBar-height', '0px');
      document.getElementById('app_name').style.display = "none";
    } else {
      root.style.setProperty('--titleBar-display', 'block');
    }
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
  open_alert("static/alerts/settings.html", "settings_alert", function() {get_config()});

  document.getElementById("settings_General_autoStart").checked = SETTINGS_DICT["General"]["autoStart"];
  document.getElementById("settings_General_keepBackground").checked = SETTINGS_DICT["General"]["keepBackground"];
  document.getElementById("settings_General_saveWindowState").checked = SETTINGS_DICT["General"]["saveWindowState"];
  document.getElementById("settings_Appearance_thame_light").checked = SETTINGS_DICT["Appearance"]["thame"] == "light";
  document.getElementById("settings_Appearance_thame_dark").checked = SETTINGS_DICT["Appearance"]["thame"] == "dark";
  document.getElementById("settings_Appearance_thame_system").checked = SETTINGS_DICT["Appearance"]["thame"] == "system";
  // document.getElementById("settings_General_thame_system").checked = SETTINGS_DICT["General"]["thame"] == "system";
  document.getElementById("settings_Appearance_defaultTitleBar").checked = SETTINGS_DICT["Appearance"]["defaultTitleBar"];
  document.getElementById("settings_Appearance_animationWindow").checked = SETTINGS_DICT["Appearance"]["animationWindow"];

  document.getElementById("settings_Connections_autoConnect").checked = SETTINGS_DICT["Connections"]["autoConnect"];
  document.getElementById("settings_Connections_readyTimeout").value = SETTINGS_DICT["Connections"]["readyTimeout"];
  document.getElementById("settings_Connections_cacheData").checked = SETTINGS_DICT["Connections"]["cacheData"];
  document.getElementById("settings_Connections_maxCacheData").value = SETTINGS_DICT["Connections"]["maxCacheData"];
  document.getElementById("settings_Connections_keepaliveCountMax").value = SETTINGS_DICT["Connections"]["keepaliveCountMax"];
  document.getElementById("settings_Connections_keepaliveInterval").value = SETTINGS_DICT["Connections"]["keepaliveInterval"];
  change_settings_page("general");
  // change_settings_page("appearance");
}

get_config();
// alert_settings();

const settings_pages = [
  "general",
  "appearance",
  "account",
  "connection",
  "macros",
  "extensions"
];

function change_settings_page(page_name) {
  for (const page of settings_pages) {
    if (page == page_name) {
      document.getElementById(`settings_page_${page}`).style.display = "block";
      document.getElementById(`settings_menu_${page}`).className = "selected";
    } else {
      document.getElementById(`settings_page_${page}`).style.display = "none";
      document.getElementById(`settings_menu_${page}`).className = "";
    }
  }
}
