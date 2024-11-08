
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

      const fromGroupId = evt.from.id.split("_")[1];
      const toGroupId = evt.to.id.split("_")[1];

      // Если элемент перемещается между группами
      if (fromGroupId !== toGroupId) {
        const fromGroup = config_file[fromGroupId];
        const toGroup = config_file[toGroupId];
        const movedItem = fromGroup.items[oldIndex];

        // Удаляем элемент из исходной группы
        fromGroup.items.splice(oldIndex, 1);
        // Добавляем элемент в целевую группу
        toGroup.items.splice(newIndex, 0, movedItem);

        // Обновляем TABS
        const movedTabItem = TABS[fromGroupId].items[oldIndex];
        TABS[fromGroupId].items.splice(oldIndex, 1);
        TABS[toGroupId].items.splice(newIndex, 0, movedTabItem);

        TABS[fromGroupId].items.forEach((item, index) => {
          item.id = index; // Обновляем id на основе нового индекса
        });
        TABS[toGroupId].items.forEach((item, index) => {
          item.id = index;
        });

        updateGroupsIds(fromGroupId, toGroupId);
      } else {
        // Если элемент перемещается внутри одной группы
        const group = config_file[fromGroupId];
        const movedItem = group.items[oldIndex];

        // Обновляем config_file
        group.items.splice(oldIndex, 1);
        group.items.splice(newIndex, 0, movedItem);

        // Обновляем TABS
        const movedTabItem = TABS[fromGroupId].items[oldIndex];
        TABS[fromGroupId].items.splice(oldIndex, 1);
        TABS[fromGroupId].items.splice(newIndex, 0, movedTabItem);

        TABS[fromGroupId].items.forEach((item, index) => {
          item.id = index; // Обновляем id на основе нового индекса
        });

        updateGroupsIds(fromGroupId);
      }

      // Сохраняем изменения в store
      store.set('connections', config_file);
      console.log(TABS);
    }
  });
}

function updateGroupsIds(groupIdOne, groupIdTwo=undefined) {
  const groupOneList = document.getElementById(`items_${groupIdOne}`).getElementsByTagName('LI');
  const groupTwoList = (!!groupIdTwo)? document.getElementById(`items_${groupIdTwo}`).getElementsByTagName('LI'): {length: 0};
  const maxLength = (groupOneList.length > groupTwoList.length)? groupOneList.length: groupTwoList.length;
  for (let index = maxLength - 1; index >= 0; index--) {
    var OneItem = undefined;
    var OneIframe = undefined;
    var OneLi = undefined;
    var OneStatus = undefined;
    var OneReconnect = undefined;
    // Получем элементы по старым иденторам (Сначала для первой группы)
    if (groupOneList[index]) {
      const OneOldGroup = groupOneList[index].id.split("_")[1];
      const OneOldId = groupOneList[index].id.split("_")[2];
      OneItem       = document.getElementById(`item_${OneOldGroup}_${OneOldId}`);
      OneIframe     = document.getElementById(`iframe_${OneOldGroup}_${OneOldId}`);
      OneLi         = document.getElementById(`li_${OneOldGroup}_${OneOldId}`);
      OneStatus     = document.getElementById(`status_${OneOldGroup}_${OneOldId}`);
      OneReconnect  = document.getElementById(`reconnect_${OneOldGroup}_${OneOldId}`);
    }

    var TwoItem = undefined;
    var TwoIframe = undefined;
    var TwoLi = undefined;
    var TwoStatus = undefined;
    var TwoReconnect = undefined;
    // а теперь для второй
    if (groupTwoList[index]) {
      const TwoOldGroup = groupTwoList[index].id.split("_")[1];
      const TwoOldId = groupTwoList[index].id.split("_")[2];
      TwoItem       = document.getElementById(`item_${TwoOldGroup}_${TwoOldId}`);
      TwoIframe     = document.getElementById(`iframe_${TwoOldGroup}_${TwoOldId}`);
      TwoLi         = document.getElementById(`li_${TwoOldGroup}_${TwoOldId}`);
      TwoStatus     = document.getElementById(`status_${TwoOldGroup}_${TwoOldId}`);
      TwoReconnect  = document.getElementById(`reconnect_${TwoOldGroup}_${TwoOldId}`);
    }
    // console.log(OneItem, TwoItem);

    // Заменяем старые идентификаторы на новые
    if (!!OneItem) {
      OneItem.id      = `item_${groupIdOne}_${index}`;
      OneIframe.id    = `iframe_${groupIdOne}_${index}`;
      OneLi.id        = `li_${groupIdOne}_${index}`;
      OneStatus.id    = `status_${groupIdOne}_${index}`;
      OneReconnect.id = `reconnect_${groupIdOne}_${index}`;
    }

    if (!!groupIdTwo && !!TwoItem) {
      TwoItem.id      = `item_${groupIdTwo}_${index}`;
      TwoIframe.id    = `iframe_${groupIdTwo}_${index}`;
      TwoLi.id        = `li_${groupIdTwo}_${index}`;
      TwoStatus.id    = `status_${groupIdTwo}_${index}`;
      TwoReconnect.id = `reconnect_${groupIdTwo}_${index}`;
    }

  }
}

ipcRenderer.on('context-menu-command', (e, command) => {
  if (command.target == "connection") {
    eval(`document.getElementById("iframe_${command.id}").contentWindow.${command.function}("${command.action}")`);
  }
})
