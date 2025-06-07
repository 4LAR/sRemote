
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
  open_alert(`
    <p class="name_settings">${localization_dict.settings_title}</p>
    <hr class="hr_settings">
    <ul class="settings_list block_select">
      <li id="settings_menu_general" onclick="change_settings_page('general')">
        <div></div>
        <div class="selector"></div>
        <img src="./static/img/settings/general.svg" alt="">
        <p>${localization_dict.settings_menu_general}</p>
      </li>
      <li id="settings_menu_appearance" onclick="change_settings_page('appearance')">
        <div></div>
        <div class="selector"></div>
        <img src="./static/img/settings/appearance.svg" alt="">
        <p>${localization_dict.settings_menu_appearance}</p>
      </li>
      <li id="settings_menu_account" onclick="change_settings_page('account')">
        <div></div>
        <div class="selector"></div>
        <img src="./static/img/settings/account.svg" alt="">
        <p>${localization_dict.settings_menu_account}</p>
      </li>
      <li id="settings_menu_connection" onclick="change_settings_page('connection')">
        <div></div>
        <div class="selector"></div>
        <img src="./static/img/settings/connection.svg" alt="">
        <p>${localization_dict.settings_menu_connection}</p>
      </li>
      <li id="settings_menu_macros" onclick="change_settings_page('macros')">
        <div></div>
        <div class="selector"></div>
        <img src="./static/img/settings/macros.svg" alt="">
        <p>Macros</p>
      </li>
      <li id="settings_menu_extensions" onclick="change_settings_page('extensions')">
        <div></div>
        <div class="selector"></div>
        <img src="./static/img/settings/extensions.svg" alt="">
        <p>Extensions</p>
      </li>
    </ul>
    <div class="settings_body scroll_style block_select" onchange="settings_change(event)">
      <div class="settings_page" id="settings_page_general">
        <div class="selector">
          <label>${localization_dict.settings_General_lang}:</label>
          ${select_generator({"English": "en", "Русский": "ru"}, "settings_General_lang", "input_style", SETTINGS_DICT["General"]["lang"])}
        </div>

        <div class="checkbox" for="settings_General_autoStart">
          <input type="checkbox" id="settings_General_autoStart">
          <label for="settings_General_autoStart">${localization_dict.settings_General_autoStart}</label>
        </div>

        <div class="checkbox" for="settings_General_keepBackground">
          <input type="checkbox" id="settings_General_keepBackground">
          <label for="settings_General_keepBackground">${localization_dict.settings_General_keepBackground}</label>
        </div>

        <div class="checkbox" for="settings_General_saveWindowState">
          <input type="checkbox" id="settings_General_saveWindowState">
          <label for="settings_General_saveWindowState">${localization_dict.settings_General_saveWindowState}</label>
        </div>

      </div>

      <div class="settings_page" id="settings_page_appearance">
        <p class="settings_h">${localization_dict.settings_Appearance_thame}</p>

        <div class="settings_grid block_select">
          <label for="settings_Appearance_thame_light" class="checkbox-round-image">
            <img class="disable-drag" src="./static/img/settings/thame/light-thame.svg" alt="">
            <div>
              <p>${localization_dict.settings_Appearance_thame_light}</p>
            </div>
            <input type="radio" id="settings_Appearance_thame_light" name="thame">
          </label>
          <label for="settings_Appearance_thame_dark" class="checkbox-round-image">
            <img class="disable-drag" src="./static/img/settings/thame/dark-thame.svg" alt="">
            <div>
              <p>${localization_dict.settings_Appearance_thame_dark}</p>
            </div>
            <input type="radio" id="settings_Appearance_thame_dark" name="thame">
          </label>
          <label for="settings_Appearance_thame_system" class="checkbox-round-image">
            <img class="disable-drag" src="./static/img/settings/thame/system-thame.svg" alt="">
            <div>
              <p>${localization_dict.settings_Appearance_thame_system}</p>
            </div>
            <input type="radio" id="settings_Appearance_thame_system" name="thame">
          </label>
        </div>

        <div class="checkbox" for="settings_Appearance_defaultTitleBar">
          <input type="checkbox" id="settings_Appearance_defaultTitleBar">
          <label for="settings_Appearance_defaultTitleBar">${localization_dict.settings_Appearance_defaultTitleBar}</label>
        </div>

        <div class="checkbox" for="settings_Appearance_animationWindow">
          <input type="checkbox" id="settings_Appearance_animationWindow">
          <label for="settings_Appearance_animationWindow">${localization_dict.settings_Appearance_animationWindow}</label>
        </div>
      </div>

      <div id="settings_page_account">
        <div id="settings_account_login_container">
          <div class="user_icon">
            <img class="default" src="./static/img/settings/account.svg" alt="">
          </div>
          <p class="error" id="auth_error"></p>
          <input type="text" class="input_style" id="settings_account_login" placeholder="Login">
          <input type="password" class="input_style" id="settings_account_password" placeholder="Password">
          <a href="#">Forgot your password?</a>
          <div id="" class="button" onclick="()">
            <p>Login</p>
          </div>
          <div class="register">
            <p>If you don't have an account, you can create one.</p>
            <div id="" class="button" onclick="()">
              <p>Register</p>
            </div>
          </div>
        </div>

        <div id="settings_account_user_container">

        </div>

        <p>Groups on server</p>
        <ul id="settings_account_server">

        </ul>

        <p>Groups on your local machine</p>
        <ul id="settings_account_local">

        </ul>

      </div>
      <div class="settings_page" id="settings_page_connection">
        <div class="checkbox" for="settings_Connections_autoConnect">
          <input type="checkbox" id="settings_Connections_autoConnect">
          <label for="settings_Connections_autoConnect">${localization_dict.settings_Connections_autoConnect}</label>
        </div>

        <div class="number">
          <input type="number" class="input_style" id="settings_Connections_readyTimeout">
          <label for="settings_Connections_readyTimeout">${localization_dict.settings_Connections_readyTimeout}</label>
        </div>

        <div class="checkbox" for="settings_Connections_cacheData" style="display: none">
          <input type="checkbox" id="settings_Connections_cacheData">
          <label for="settings_Connections_cacheData">${localization_dict.settings_Connections_cacheData}</label>
        </div>

        <div class="number" style="display: none">
          <input type="number" class="input_style" id="settings_Connections_maxCacheData">
          <label for="settings_Connections_maxCacheData">${localization_dict.settings_Connections_maxCacheData}</label>
        </div>
        <br>
        <div class="number">
          <input type="number" class="input_style" id="settings_Connections_keepaliveCountMax">
          <label for="settings_Connections_keepaliveCountMax">${localization_dict.settings_Connections_keepaliveCountMax}</label>
        </div>

        <div class="number">
          <input type="number" class="input_style" id="settings_Connections_keepaliveInterval">
          <label for="settings_Connections_keepaliveInterval">${localization_dict.settings_Connections_keepaliveInterval}</label>
        </div>
      </div>

      <div id="settings_page_macros">
        <ul id="settings_macros_list">
          <li>
            <select>
              <option>hotkey</option>
              <option>alias</option>
            </select>
            <input type="text" value="name"/>
            <textarea></textarea>
          </li>
          <li>2</li>
          <li>3</li>
          <li>4</li>
        </ul>

      </div>

      <div id="settings_page_extensions">


      </div>

    </div>
    <div class="settings_buttons_bar">
      <div id="settings_save_button" class="not_active_button save" onclick="save_settings()">
        <p>${localization_dict.apply}</p>
      </div>
    </div>
  `, "settings_alert", function() {get_config()});

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
