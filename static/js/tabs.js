
const CONNECTIONS_FILE = "connections.json"
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

function append_tab(data, id="", selected=false) {
  append_to_ul("tabs", `
    <img id="${id + "_status"}" class="status_none" src="./static/img/terminal.svg">
    <p class="name">${data.name}</p>
    <p class="host">${data.host}:${data.port}</p>
    <div class="edit">
      <img src="./static/img/edit.svg">
    </div>
    <div class="delete" onclick="alert_delete_connection(${id})">
      <img src="./static/img/cross.svg">
    </div>
  `, function() {
    select_tab(id);
  }, id + "_menu", className=(selected)? "selected": "");
  append_to_ul("tabs", ``, undefined, id + "_line", "line");
  append_to_ul("terminal_list", `
    <iframe src='ssh.html?data=${JSON.stringify(data)}&id=${id}' style="display: none" id="${id + "_body"}"></div>
  `, undefined, id + "_li", "");
  document.getElementById(id + "_body").contentWindow.update_status = update_status;
}

function read() {
  var config_file = JSON.parse(JSON.stringify(require(`./${CONNECTIONS_FILE}`)));

  let i = 0;
  for (const el of config_file["connections"]) {
    try {
      TABS.push({
        "id": `${++i}`,
        "name": el.name
      });
      append_tab(el, TABS[TABS.length - 1].id);

    } catch (e) {
      console.warn(e);
    }
  }
  select_tab(TABS[0].id);
}

read();
