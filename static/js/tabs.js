
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
function get_ids_from_event(event) {
  var id = "";
  id = event.target.id;
  if (!event.target.id) {
    id = event.target.parentElement.id;
  }
  return [id.split("_")[1], id.split("_")[2]];
}

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
  var items_elem = document.getElementById(`items_${group_id}`);
  var items_list = items_elem.getElementsByTagName('LI');
  var delta_pixels = (items_list.length > 0)? items_list[0].offsetHeight: 0;
  var height = 0;
  for (let i = 0; i < items_list.length + delta_items; i++) {
    height += delta_pixels;
  }

  const isContentVisible = document.getElementById(`group_${group_id}`).className == "group selected";
  items_elem.style.height = (isContentVisible)? `${height}px`: `0px`;
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
    <div class="reconnect" onclick="reconnect_event(event)">
      <img id="reconnect_${group_id}_${item_id}" src="./static/img/play.svg">
    </div>
    <div class="edit" onclick="alert_create_edit_connection_event(event)">
      <img src="./static/img/edit.svg">
    </div>
    <!--<div class="delete" onclick="alert_delete_connection_event(event)">
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
  initializeSortableForGroup(group_id);
}

//
function append_item(data, group_id, item_id) {
  // добавляем кнопку с соеденением
  append_to_ul(
    `items_${group_id}`,
    generate_item_by_data(data, group_id, item_id),
    function(event) {
      select_item(...get_ids_from_event(event));
    },
    `item_${group_id}_${item_id}`,
    className="",
    function(event) {
      const ids = get_ids_from_event(event);
      console.log(ids);
      var iframe = document.getElementById(`iframe_${ids[0]}_${ids[1]}`);
      if (!iframe.contentWindow.connected_flag) {
        iframe.contentWindow.connect();
      }
    }
  );
  document.getElementById(`item_${group_id}_${item_id}`).draggable = true;

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

function reconnect_event(event) {
  reconnect(...get_ids_from_event(event), event);
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
    document.getElementById("left_menu").style.borderRight = `1px solid var(--border-color)`;
    document.getElementById("terminal_list").style.left = "201px";
    document.getElementById("terminal_list").style.width = "calc(100% - 201px)";
    document.getElementById("dropdown_left_menu").style.transform = "rotate(90deg)";
  } else {
    // document.getElementById("left_menu").style.left = `-${document.getElementById("left_menu").style.width}`;
    document.getElementById("left_menu").style.left = `-201px`;
    document.getElementById("left_menu").style.borderRight = `1px solid transparent`;
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
var last_drag_connection_id = undefined;
function initializeSortableForGroup(groupId) {
  const itemsList = document.getElementById(`items_${groupId}`);

  const sortable = new Sortable(itemsList, {
    group: 'connections',
    animation: 150,
    ghostClass: 'sortable-ghost', // Класс для плейсхолдера
    onStart: function (evt) {
      evt.item.style.opacity = '0.4';
    },
    onMove: function(evt) {
      if (!last_drag_connection_id)
        last_drag_connection_id = evt.from.id.split("_")[1];
      var from = last_drag_connection_id;
      var to = evt.to.id.split("_")[1];
      console.log(from, to);
      if (from == to) {
        auto_height_items(from);
        auto_height_items(to);
      } else {
        auto_height_items(from, -1);
        auto_height_items(to, 1);
      }
      last_drag_connection_id = to;
    },
    onEnd: function (evt) {
      last_drag_connection_id = undefined;
      evt.item.style.opacity = '1';
      let config_file = store.get('connections');
      console.log(config_file);
      const newIndex = evt.newIndex;
      const oldIndex = evt.oldIndex;

      const group = config_file[groupId];
      const movedItem = group.items[oldIndex];

      // Обновляем config_file
      group.items.splice(oldIndex, 1);
      group.items.splice(newIndex, 0, movedItem);

      // Обновляем TABS
      const movedTabItem = TABS[groupId].items[oldIndex];
      TABS[groupId].items.splice(oldIndex, 1);
      TABS[groupId].items.splice(newIndex, 0, movedTabItem);

      // Обновляем id внутри TABS
      TABS[groupId].items.forEach((item, index) => {
        item.id = index; // Обновляем id на основе нового индекса
      });

      const group_items = itemsList.getElementsByTagName('li');

      var iframes_list = [];
      var li_list = [];
      var status_list = [];
      var reconnect_list = [];
      for (const item of [...group_items].reverse()) {
        var group_id_ = item.id.split("_")[1]
        var item_id_ = item.id.split("_")[2]
        iframes_list.push(
          [document.getElementById(`iframe_${group_id_}_${item_id_}`), false]
        );
        li_list.push(
          [document.getElementById(`li_${group_id_}_${item_id_}`), false]
        );
        status_list.push(
          [document.getElementById(`status_${group_id_}_${item_id_}`), false]
        );
        reconnect_list.push(
          [document.getElementById(`reconnect_${group_id_}_${item_id_}`), false]
        );
      }

      console.log("iframe", iframes_list);
      console.log("li", li_list);
      console.log("status", status_list);
      console.log("reconnect", reconnect_list);

      let new_index = group_items.length - 1;
      for (const item of [...group_items].reverse()) {
        oldIndex_ = item.id.split("_")[2];
        item.id = `item_${groupId}_${new_index}`;

        for (const el of iframes_list) {
          if ((el[0].id.split("_")[2] == oldIndex_) && (!el[1])) {
            el[0].id = `iframe_${groupId}_${new_index}`;
            el[1] = true;
            el[0].contentWindow.item_id = new_index;
          }
        }
        for (const el of li_list) {
          if ((el[0].id.split("_")[2] == oldIndex_) && (!el[1])) {
            el[0].id = `li_${groupId}_${new_index}`;
            el[1] = true;
          }
        }
        for (const el of status_list) {
          if ((el[0].id.split("_")[2] == oldIndex_) && (!el[1])) {
            el[0].id = `status_${groupId}_${new_index}`;
            el[1] = true;
          }
        }
        for (const el of reconnect_list) {
          if ((el[0].id.split("_")[2] == oldIndex_) && (!el[1])) {
            el[0].id = `reconnect_${groupId}_${new_index}`;
            el[1] = true;
          }
        }
        new_index--;
      }

      // Сохраняем изменения в store
      store.set('connections', config_file);
    }
  });
}

ipcRenderer.on('context-menu-command', (e, command) => {
  if (command.target == "connection") {
    eval(`document.getElementById("iframe_${command.id}").contentWindow.${command.function}("${command.action}")`);
  }
})
