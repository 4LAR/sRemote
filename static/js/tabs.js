
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
    var in_group_flag = false;
    for (const item of group.items) {
      //
      if (group.id == group_id && item.id == item_id) {
        document.getElementById(`item_${group.id}_${item.id}`).className = "selected";
        openModal(`iframe_${group.id}_${item.id}`);
        document.getElementById(`iframe_${group.id}_${item.id}`).contentWindow.addEventListener('keydown', customKeyEventHandler);

        in_group_flag = true;
        //
        if (SETTINGS_DICT["Connections"]["autoConnect"]) {
          console.log("zalupa");
          var iframe = document.getElementById(`iframe_${group.id}_${item.id}`);
          iframe.contentWindow.onload = function() {
            iframe.contentWindow.create_connection();
          };
        }
      } else {
        document.getElementById(`item_${group.id}_${item.id}`).className = "";
        closeModal(`iframe_${group.id}_${item.id}`);
      }
      if (in_group_flag) {
        openModal(`group_indicator_${group.id}`);
      } else {
        closeModal(`group_indicator_${group.id}`);
      }
    }
  }
}

// смена индикации статуса подключения
function update_status(group_id, item_id, status) {
  document.getElementById(`status_${group_id}_${item_id}`).className = STATUS_LIST[status];
  var button_img = "";
  if ([0, 1].includes(Number(status))) {
    button_img = "./static/img/play.svg";
  } else {
    button_img = "./static/img/stop.svg";
  }
  document.getElementById(`reconnect_${group_id}_${item_id}`).src = button_img;
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
    <span class="drag_line"></span>
    <img id="status_${group_id}_${item_id}" class="status_none" src="./static/img/terminal.svg">
    <p class="name">${data.name}</p>
    <p class="host">${data.host}:${data.port}</p>
    <div class="reconnect" onclick="reconnect(${group_id}, ${item_id}, event)">
      <img id="reconnect_${group_id}_${item_id}" src="./static/img/play.svg">
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
    <div class="indicator" id="group_indicator_${id}"></div>
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
    className="",
    function() {
      var iframe = document.getElementById(`iframe_${group_id}_${item_id}`);
      if (!iframe.contentWindow.connected_flag) {
        iframe.contentWindow.connect();
      }
    }
  );
  document.getElementById(`item_${group_id}_${item_id}`).draggable = true;
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
  document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.localization_dict = localization_dict;
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
    tabs_loaded_flag = true;
    close_loading();
  } catch (e) {
    // store.set('connections', []);
    // ipcRenderer.send('relaunch');
  }
}

function reconnect(group_id, item_id, event) {
  var connect_status = document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.status;
  if ([0, 1].includes(Number(connect_status))) {
    document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.connect();
  } else {
    document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.disconnect();
  }

  if (event) {
    event.stopPropagation();
  }
}

////////////////////////////////////////////////////////////////////////////////

var left_menu_flag = true;
// открытие и закрытие списка с соеденениями
function left_menu() {
  left_menu_flag = !left_menu_flag;
  if (left_menu_flag) {
    document.getElementById("left_menu").style.left = "0px";
    document.getElementById("left_menu").style.border = `1px solid var(--border-color)`;
    document.getElementById("terminal_list").style.left = "201px";
    document.getElementById("terminal_list").style.width = "calc(100% - 201px)";
    document.getElementById("dropdown_left_menu").style.transform = "rotate(90deg)";
  } else {
    // document.getElementById("left_menu").style.left = `-${document.getElementById("left_menu").style.width}`;
    document.getElementById("left_menu").style.left = `-201px`;
    document.getElementById("left_menu").style.border = `1px solid transparent`;
    document.getElementById("terminal_list").style.left = "1px";
    document.getElementById("terminal_list").style.width = "calc(100% - 1px)";
    document.getElementById("dropdown_left_menu").style.transform = "rotate(-90deg)";
  }
}

// обработка горячих клавиш
function customKeyEventHandler(e) {
  if (e.type !== "keydown") {
    return true;
  }
  if (e.ctrlKey && e.shiftKey) {
    const code = e.code;
    if (code === "KeyB") {
      left_menu();
      return false;
    }
  }
  return true;
}

window.addEventListener('keydown', customKeyEventHandler);

/*----------------------------------------------------------------------------*/

var drag_item_id = "";
var hovered_item = undefined;
const items_drag_list = document.getElementById("tabs");

items_drag_list.addEventListener(
  "dragstart",
  function(e) {
    e.target.style = "opacity: .4";
    drag_item_id = e.target.id;
    items_drag_list.className = `tabs block_select drag`;
  }
)

items_drag_list.addEventListener(
  "dragend",
  function(e) {
    e.target.style = "opacity: 1";
  }
)

items_drag_list.addEventListener(
  "dragenter",
  function(e) {
    if ((e.target.id.split("_")[0] == "item" && (e.target.id !== drag_item_id))) {
      e.target.getElementsByClassName("drag_line")[0].style = "display: block";
      hovered_item = e.target.getElementsByClassName("drag_line")[0];
    }
  }
)

items_drag_list.addEventListener(
  "dragleave",
  function(e) {
    if ((e.target.id.split("_")[0] == "item" && (e.target.id !== drag_item_id))) {
      e.target.getElementsByClassName("drag_line")[0].style = "display: none";
    }
  }
)

items_drag_list.addEventListener(
  "drop",
  function(e) {
    const group_id = e.target.id.split("_")[1];
    const item_id = e.target.id.split("_")[2];

    const drag_group_id_ = drag_item_id.split("_")[1];
    const drag_item_id_ = drag_item_id.split("_")[2];

    document.getElementById('id')
    document.getElementById(`items_${group_id}`).insertBefore(document.getElementById(drag_item_id), e.target);
    document.getElementById(`items_${group_id}`).insertBefore(document.getElementById(`line_${drag_group_id_}_${drag_item_id_}`), e.target);
    auto_height_items(group_id);
    items_drag_list.className = `tabs block_select`;
    hovered_item.style = "display: none";
    console.log(e.target.id);
  }
)
