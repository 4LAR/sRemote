
//
const Store = require('electron-store');
const store = new Store();

var TABS = []; //

//
const STATUS_LIST = [
  "status_none",
  "status_warning",
  "status_loading",
  "status_run"
]

//
function get_index_group_by_id(group_id) {
  var real_group_id = 0;
  for (const group of TABS) {
    if (group.id == group_id)
      return real_group_id;
    real_group_id++;
  }
}

//
function get_indexes_by_id(group_id, item_id) {
  var real_group_id = get_index_group_by_id(group_id);
  var real_item_id = 0;
  for (const item of TABS[real_group_id].items) {
    if (item.id == item_id) {
      return [real_group_id, real_item_id];
    }
    real_item_id++;
  }
}

//
function select_item(group_id, item_id) {
  for (const group of TABS) {
    for (const item of group.items) {
      //
      if (group.id == group_id && item.id == item_id) {
        document.getElementById(`item_${group.id}_${item.id}`).className = "selected";
        openModal(`iframe_${group.id}_${item.id}`);
        //
        if (!SETTINGS_DICT["Connections"]["autoConnect"]) {
          var iframe = document.getElementById(`iframe_${group.id}_${item.id}`);
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
        document.getElementById(`item_${group.id}_${item.id}`).className = "";
        closeModal(`iframe_${group.id}_${item.id}`);
      }
    }
  }
}

//
function update_status(group_id, item_id, status) {
  document.getElementById(`status_${group_id}_${item_id}`).className = STATUS_LIST[status];
}

//
function auto_height_items(group_id, delta_items=0) {
  var items_list = document.getElementById(`items_${group_id}`);
  var delta_pixels = 0;
  if (delta_items !== 0) {
    var ul_length = document.getElementById(`group_${group_id}`).getElementsByClassName("line").length;
    delta_pixels = items_list.scrollHeight / ul_length;
  }

  const isContentVisible = document.getElementById(`group_${group_id}`).className == "group selected";
  items_list.style.height = (isContentVisible)? `${items_list.scrollHeight + ((delta_items !== 0)? (delta_pixels * delta_items): 0)}px`: `0px`;
}

//
function open_group(group_id) {
  var index = get_index_group_by_id(group_id);
  if (TABS[index].open_flag) {
    document.getElementById(`group_${group_id}`).className = "group";
  } else {
    document.getElementById(`group_${group_id}`).className = "group selected";
  }
  TABS[index].open_flag = !TABS[index].open_flag;

  auto_height_items(group_id);

  var config_file = store.get('connections');
  config_file[index].open_flag = TABS[index].open_flag;
  store.set('connections', config_file);
}

//
function generate_item_by_data(data, group_id, item_id="") {
  return `
    <img id="status_${group_id}_${item_id}" class="status_none" src="./static/img/terminal.svg">
    <p class="name">${data.name}</p>
    <p class="host">${data.host}:${data.port}</p>
    <div class="reconnect" onclick="reconnect(${group_id}, ${item_id}, event)">
      <img src="./static/img/reload.svg">
    </div>
    <div class="edit" onclick="alert_create_edit_connection(${group_id}, ${item_id}, event, true)">
      <img src="./static/img/edit.svg">
    </div>
    <!--<div class="delete" onclick="alert_delete_connection(${group_id}, ${item_id}, event)">
      <img src="./static/img/cross.svg">
    </div>-->
  `;
}

//
function generate_group_data(data, id="") {
  return `
    <img class="dropdown" src="./static/img/dropdown.svg">
    <p class="group_name">${data.name}</p>
    <div class="hitbox" onclick="open_group(${id})">

    </div>

    <div class="more group_activity" onclick="alert_edit_create_group(${id}, event, true)">
      <img src="./static/img/edit.svg">
    </div>
    <div class="add group_activity" onclick="alert_create_edit_connection(${id}, undefined, event, false)">
      <img src="./static/img/add.svg">
    </div>

    <div class="line"></div>
    <ul class="tabs_items" id="items_${id}"></ul>
    <p class="empty_group">empty</p>
  `
}

//
function append_group(data, group_id, selected=false) {
  // добавляем кнопку с группой
  append_to_ul(
    "tabs",
    generate_group_data(data, group_id),
    undefined,
    `group_${group_id}`,
    className=(selected)? "group selected": "group"
  );
}

//
function append_item(data, group_id, item_id) {
  // добавляем кнопку с соеденением
  append_to_ul(
    `items_${group_id}`,
    generate_item_by_data(data, group_id, item_id),
    function() {
      select_item(group_id, item_id);
    },
    `item_${group_id}_${item_id}`,
    className=""
  );
  // добавляем линию для разделения сединений
  append_to_ul(
    `items_${group_id}`,
    ``,
    undefined,
    `line_${group_id}_${item_id}`,
    "line"
  );
  //
  append_to_ul(
    "terminal_list", `
      <iframe src='ssh.html?data=${JSON.stringify(data)}&config=${JSON.stringify(SETTINGS_DICT)}&group_id=${group_id}&item_id=${item_id}&data_path=${path.dirname(store.path)}' style="display: none" id="iframe_${group_id}_${item_id}"></div>
    `,
    undefined,
    `li_${group_id}_${item_id}`,
    ""
  );
  //
  document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.update_status = update_status;
}

//
function read() {
  var config_file;
  //
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

  try {
    var group_id = -1;
    //
    for (const group of config_file) {
      group_id++;
      //
      TABS.push({
        "id": group_id,
        "name": group.name,
        "open_flag": group.open_flag || false,
        "items": []
      });

      append_group(group, group_id, group.open_flag);

      var item_id = -1;
      //
      for (const item of group.items) {
        item_id++;
        //
        TABS[group_id].items.push({
          "id": item_id,
          "name": item.name || "TEST",
          "host": item.host || "0.0.0.0",
          "port": item.port || "22",
          "auth_scheme": item.auth_scheme || "lap",
          "username": item.username || "user",
          "password": item.password || "password",
          "privateKey": item.privateKey || "",
          "first_command": item.first_command || "",
          "search": item.name + item.host + ":" + item.port
        });
        //
        append_item(item, group_id, item_id);
      }
      auto_height_items(group_id);
    }
  } catch (e) {
    // store.set('connections', []);
    // ipcRenderer.send('relaunch');
  }
}

function reconnect(group_id, item_id, event) {
  document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.reconnect();
  if (event) {
    event.stopPropagation();
  }
}
