
const Store = require('electron-store');
const store = new Store();
console.log(store.store);
console.log(store.path);

var TABS = [];
var SELECTED = 0;

const STATUS_LIST = [
  "status_none",
  "status_warning",
  "status_loading",
  "status_run"
]

function get_index_by_id(id) {
  var i = 0;
  for (const el of TABS) {
    if (el.id == id)
      return i;
    i++;
  }
}

function select_tab(id) {
  var i = 0;
  for (const el of TABS) {
    if (el.id == id) {
      SELECTED = i
      document.getElementById(el.id + "_menu").className = "selected";
      openModal(el.id + "_body");
      if (!SETTINGS_DICT["Connections"]["autoConnect"]) {
        var iframe = document.getElementById(id + "_body");
        if (iframe.contentWindow.create_connection !== undefined) {
          if (iframe.contentWindow.first_connect)
            iframe.contentWindow.create_connection();
        } else {
          iframe.contentWindow.onload = function() {
            iframe.contentWindow.create_connection();
          };
        }
      }
    } else {
      document.getElementById(el.id + "_menu").className = "";
      closeModal(el.id + "_body");
    }
    i++;
  }
}

function update_status(id, status) {
  document.getElementById(id + "_status").className = STATUS_LIST[status];
}

function generate_tab_by_data(data, id="") {
  return `
    <img id="${id + "_status"}" class="status_none" src="./static/img/terminal.svg">
    <p class="name">${data.name}</p>
    <p class="host">${data.host}:${data.port}</p>
    <div class="reconnect" onclick="reconnect(${id}, event)">
      <img src="./static/img/reload.svg">
    </div>
    <div class="edit" onclick="alert_create_edit_connection(${id}, event, true)">
      <img src="./static/img/edit.svg">
    </div>
    <div class="delete" onclick="alert_delete_connection(${id}, event)">
      <img src="./static/img/cross.svg">
    </div>
  `;
}

function append_tab(data, id="") {
  append_to_ul(
    "tabs",
    generate_tab_by_data(data, id),
    function() {
      select_tab(id);
    },
    id + "_menu",
    className=""
  );
  append_to_ul("tabs", ``, undefined, id + "_line", "line");
  append_to_ul("terminal_list", `
    <iframe src='ssh.html?data=${JSON.stringify(data)}&config=${JSON.stringify(SETTINGS_DICT)}&id=${id}' style="display: none" id="${id + "_body"}"></div>
  `, undefined, id + "_li", "");
  document.getElementById(id + "_body").contentWindow.update_status = update_status;
}

function read() {
  var config_file;
  if (store.has('connections')) {
    try {
      config_file = store.get('connections');
    } catch (e) {
      config_file = [];
      store.set('connections', config_file);
    }
  } else {
    config_file = [];
    store.set('connections', config_file);
  }

  let i = 0;
  var error_flag = false;
  for (const el of config_file) {
    try {
      TABS.push({
        "id": `${++i}`,
        "name": el.name || "TEST",
        "host": el.host || "0.0.0.0",
        "port": el.port || "22",
        "auth_scheme": el.auth_scheme || "lap",
        "username": el.username || "user",
        "password": el.password || "password",
        "privateKey": el.privateKey || "",
        "first_command": el.first_command || "",
        "search": el.name + el.host + ":" + el.port
      });
      append_tab(el, TABS[TABS.length - 1].id);

    } catch (e) {
      console.warn(e);
      config_file.splice(i - 1, 1);
      error_flag = true;
    }
  }
  if (TABS.length > 0 && SETTINGS_DICT["Connections"]["autoConnect"])
    select_tab(TABS[0].id);

  if (error_flag)
    store.set('connections', config_file);
}

function search() {
  var search = document.getElementById("search").value.toLowerCase();
  if (search.length < 1) {
    for (const el of TABS) {
      openModal(el.id + "_menu");
      openModal(el.id + "_line");
    }
    closeModal("toolBar_info");
    return;
  }
  let count_found = 0;
  for (const el of TABS) {
    var search_item = el.search.toLowerCase();
    if (search_item.indexOf(search) > -1) {
      count_found++;
      openModal(el.id + "_menu");
      openModal(el.id + "_line");
    } else {
      closeModal(el.id + "_menu");
      closeModal(el.id + "_line");
    }
  }
  if (count_found < 1) {
    openModal("toolBar_info");
    document.getElementById("toolBar_info").innerHTML = "No connections found";
  } else {
    closeModal("toolBar_info");
  }
}

function reconnect(id, event) {
  document.getElementById(id + "_body").contentWindow.reconnect();
  if (event) {
    event.stopPropagation();
  }
}

// document.getElementById("search").addEventListener("keyup", function() {debounce(search, 100)});
document.getElementById("search").onkeyup = debounce(search, 250);
