
// const rootPath = require('electron-root-path').rootPath;
const isPackaged = require('electron-is-packaged').isPackaged;

const CONNECTIONS_FILE = `${(isPackaged)? process.env.PORTABLE_EXECUTABLE_DIR + "/": "./"}connections.json`
var TABS = [];
var SELECTED = 0;
console.log(CONNECTIONS_FILE);

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
    <div class="edit" onclick="alert_edit_connection(${id}, event)">
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
    <iframe src='ssh.html?data=${JSON.stringify(data)}&id=${id}' style="display: none" id="${id + "_body"}"></div>
  `, undefined, id + "_li", "");
  document.getElementById(id + "_body").contentWindow.update_status = update_status;
}

function read() {
  var config_file;
  try {
    config_file = JSON.parse(JSON.stringify(require(CONNECTIONS_FILE)));
  } catch (e) {
    console.log(e);
    config_file = {
      "connections": []
    }
    fs.writeFile(
      `${CONNECTIONS_FILE}`,
      JSON.stringify(
        config_file,
        null,
        2
      ),
      (err) => err && console.error(err)
    );
  }

  let i = 0;
  for (const el of config_file["connections"]) {
    try {
      TABS.push({
        "id": `${++i}`,
        "name": el.name,
        "host": el.host,
        "port": el.port,
        "username": el.username,
        "password": el.password,
        "search": el.name + el.host + ":" + el.port
      });
      append_tab(el, TABS[TABS.length - 1].id);

    } catch (e) {
      console.warn(e);
    }
  }
  if (TABS.length > 0)
    select_tab(TABS[0].id);
}

document.addEventListener("DOMContentLoaded", read);

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
