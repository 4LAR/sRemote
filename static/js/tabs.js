
// Место где будут храниться временные файлы
const tempDir = path.join(path.dirname(store.path), 'temp');
console.log("temp dir:", tempDir);
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

var TABS = []; // Сконвертированный список соединений

// Статус соединений
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

function get_id_group_from_event(event) {
  var id = "";
  id = event.target.parentElement.id;
  if (!event.target.parentElement.id) {
    id = event.target.parentElement.parentElement.id;
  }
  return id.split("_")[1];
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
        try {
          document.getElementById(`iframe_${group.id}_${item.id}`).focus();
          document.getElementById(`iframe_${group.id}_${item.id}`).contentWindow.focusOnTerminal();
        } catch (e) {}

        in_group_flag = true;
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
    if (items_list.length >= i || items_list[i].style.display !== "none")
      height += delta_pixels;
  }

  if (height < 1) {
    height = 41;
  }

  const isContentVisible = document.getElementById(`group_${group_id}`).className == "group selected";
  items_elem.style.height = (isContentVisible)? `${height}px`: `0px`;
}

//
function open_group(event) {
  const group_id = get_id_group_from_event(event);
  var index = get_index_group_by_id(group_id);
  if (TABS[index].open_flag) {
    document.getElementById(`group_${group_id}`).className = "group";
  } else {
    document.getElementById(`group_${group_id}`).className = "group selected";
  }
  TABS[index].open_flag = !TABS[index].open_flag;

  auto_height_items(group_id);

  var config_file = connectionsStore.get();
  config_file[index].open_flag = TABS[index].open_flag;
  connectionsStore.set(config_file);
}

//
function generate_item_by_data(data, group_id, item_id="") {
  return `
    <img id="status_${group_id}_${item_id}" class="status_none" src="./static/img/type/${data.ico}.svg">
    <div class="indicator"></div>
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
    <div class="hitbox" onclick="open_group(event)"></div>

    <div class="more group_activity" onclick="alert_edit_create_group(event, true)">
      <img src="./static/img/edit.svg">
    </div>
    <div class="add group_activity" onclick="alert_create_edit_connection(undefined, undefined, event, false)">
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
      var iframe = document.getElementById(`iframe_${ids[0]}_${ids[1]}`);
      if (!iframe.contentWindow.connected_flag) {
        iframe.contentWindow.connect();
      }
    }
  );
  document.getElementById(`item_${group_id}_${item_id}`).draggable = true;

  document.getElementById(`item_${group_id}_${item_id}`).addEventListener('contextmenu', function (e) {
    e.preventDefault();
    const ids = get_ids_from_event({target: {id: this.id}});
    const status_connection = document.getElementById(`iframe_${ids[0]}_${ids[1]}`).contentWindow.connected_flag;
    ipcRenderer.send('show-context-menu', {
      target: "main",
      function: "tabs_context",
      arg: `${ids[0]}_${ids[1]}`,
      template: [
        {
          label: (status_connection)? 'Disconnect': 'Connect',
          enabled: true
        }, {
          type: 'separator'
        }, {
          label: 'Edit',
          enabled: true
        }, {
          label: 'Duplicate',
          enabled: true
        }, {
          type: 'separator'
        }, {
          label: 'Delete',
          enabled: true
        },
      ]
    });
  });

  append_to_ul(
    "terminal_list", `
      <iframe src='ssh.html?data=${JSON.stringify(data)}&config=${JSON.stringify(SETTINGS_DICT)}&group_id=${group_id}&item_id=${item_id}&data_path=${path.dirname(store.path)}' style="display: none" id="iframe_${group_id}_${item_id}"></div>
    `,
    undefined,
    `li_${group_id}_${item_id}`,
    ""
  );
  //
  const iframe = document.getElementById(`iframe_${group_id}_${item_id}`);
  iframe.contentWindow.update_status = update_status;
  iframe.contentWindow.localization_dict = localization_dict;
  iframe.contentWindow.addEventListener('keydown', (e) => hotkeyStore.keydown(e, iframe));
  iframe.contentWindow.mainHotkey = (e) => hotkeyStore.keydown(e, iframe);
}

//
function read() {
  var config_file;
  //
  if (store.has('connections')) {
    try {
      config_file = connectionsStore.get();
    } catch (e) {
      config_file = [];
      console.log(e);
      document.getElementById('main_password_block').style.display = "flex";
      document.getElementById("main_password").focus();
      return;
    }
  } else {
    config_file = [];
    connectionsStore.set(config_file);
  }

  try {
    var group_id = -1;
    let errorRead = false;
    //
    for (const group of config_file) {
      group_id++;
      //
      let insertedGroup = {
        "id": group_id,
        "items": []
      };

      for (const param of DATA_GROUP_TO_READ) {
        if (group[param.key] !== undefined) {
          insertedGroup[param.key] = group[param.key];
        } else {
          insertedGroup[param.key] = (typeof param.default === 'function')? param.default() :param.default;;
          errorRead = true;
          console.warn("Error read group", group[param.key], param.key);
        }
      }

      TABS.push(insertedGroup);

      append_group(group, group_id, group.open_flag);

      var item_id = -1;
      //
      for (const item of group.items) {
        item_id++;
        //
        let insertedItem = {
          "id": item_id
        };

        for (const param of DATA_CONNECTION_TO_READ) {
          if (item[param.key] !== undefined) {
            insertedItem[param.key] = item[param.key];
          } else {
            insertedItem[param.key] = (typeof param.default === 'function')? param.default() :param.default;
            errorRead = true;
            console.warn("Error read connection", item[param.key], param.key);
          }
        }

        insertedItem["ico"] = fs.existsSync(path.join(__dirname, 'static', 'img', 'type', `${insertedItem["ico"]}.svg`))? insertedItem["ico"]: "terminal";
        insertedItem["search"] = insertedItem.name + insertedItem.host + ":" + insertedItem.port;

        const insertedItemId = TABS[group_id].items.push(insertedItem);

        append_item(TABS[group_id].items[insertedItemId - 1], group_id, item_id);
      }
      auto_height_items(group_id);
    }

    if (errorRead) {
      let insertData = [];
      for (group of TABS) {
        let insert_group = {
          items: []
        };
        for (const param of DATA_GROUP_TO_READ)
          insert_group[param.key] = group[param.key];
        let insertedGroupId = insertData.push(insert_group) - 1;
        for (item of group.items) {
          let insert_item = {};
          for (const param of DATA_CONNECTION_TO_READ)
            insert_item[param.key] = item[param.key];
          insertData[insertedGroupId].items.push(insert_item);
        }
      }
      connectionsStore.set(insertData);
    }

    tabs_loaded_flag = true;
    close_loading();
  } catch (e) {
    console.error("Loadading connections error", e);
    // connectionsStore.set([]);
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
    document.getElementById("left_menu").style.zIndex  = "10";
    document.getElementById("left_menu").style.borderRight = `1px solid var(--border-color)`;
    document.getElementById("terminal_list").style.left = "201px";
    document.getElementById("terminal_list").style.width = "calc(100% - 201px)";
    document.getElementById("dropdown_left_menu").style.transform = "rotate(90deg)";
  } else {
    // document.getElementById("left_menu").style.left = `-${document.getElementById("left_menu").style.width}`;
    document.getElementById("left_menu").style.left = `-201px`;
    document.getElementById("left_menu").style.zIndex  = `1`;
    document.getElementById("left_menu").style.borderRight = `10px solid transparent`;
    document.getElementById("terminal_list").style.left = "1px";
    document.getElementById("terminal_list").style.width = "calc(100% - 1px)";
    document.getElementById("dropdown_left_menu").style.transform = "rotate(-90deg)";
  }
}

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
      let config_file = connectionsStore.get();
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

        updateGroupsIds([fromGroupId, toGroupId]);
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

        updateGroupsIds([fromGroupId]);
      }

      // Сохраняем изменения в store
      connectionsStore.set(config_file);
    }
  });
}

// Обновление всех идентификаторов внутри групп id которых указаны в updateIds (updateIds = [int, ...])
function updateGroupsIds(updateIds) {
  const groupsList = updateIds.map(o => document.getElementById(`items_${o}`).getElementsByTagName('LI'));
  const maxLength = Math.max(...groupsList.map(o => o.length));
  var groupsComponents = [];
  for (const _ of groupsList) {
    groupsComponents.push([]);
  }

  // Получем элементы по старым иденторам
  for (let index = 0; index < maxLength; index++) {
    for (let groupIndex = 0; groupIndex < groupsList.length; groupIndex++) {
      if (!groupsList[groupIndex][[index]])
        continue;

      const OldGroup = groupsList[groupIndex][index].id.split("_")[1];
      const OldId = groupsList[groupIndex][index].id.split("_")[2];
      groupsComponents[groupIndex].push({
        Item: document.getElementById(`item_${OldGroup}_${OldId}`),
        Iframe: document.getElementById(`iframe_${OldGroup}_${OldId}`),
        Li: document.getElementById(`li_${OldGroup}_${OldId}`),
        Status: document.getElementById(`status_${OldGroup}_${OldId}`),
        Reconnect: document.getElementById(`reconnect_${OldGroup}_${OldId}`)
      });
    }
  }

  // Заменяем старые идентификаторы на новые
  for (let index = 0; index < maxLength; index++) {
    for (let groupIndex = 0; groupIndex < groupsList.length; groupIndex++) {
      if (!groupsComponents[groupIndex][index])
        continue;

      const groupId = updateIds[groupIndex];
      groupsComponents[groupIndex][index].Item.id      = `item_${groupId}_${index}`;
      groupsComponents[groupIndex][index].Li.id        = `li_${groupId}_${index}`;
      groupsComponents[groupIndex][index].Status.id    = `status_${groupId}_${index}`;
      groupsComponents[groupIndex][index].Reconnect.id = `reconnect_${groupId}_${index}`;
      groupsComponents[groupIndex][index].Iframe.id    = `iframe_${groupId}_${index}`;
      groupsComponents[groupIndex][index].Iframe.contentWindow.group_id = groupId;
      groupsComponents[groupIndex][index].Iframe.contentWindow.item_id = index;
    }
  }
}

/*----------------------------------------------------------------------------*/

const sortable_groups = new Sortable(document.getElementById('tabs'), {
  group: 'groups',
  animation: 150,
  ghostClass: 'sortable-ghost', // Класс для плейсхолдера
  onStart: function (evt) {
    evt.item.style.opacity = '0.4';
  },
  onMove: function(evt) {

  },
  onEnd: function (evt) {
    evt.item.style.opacity = '1';

    let config_file = connectionsStore.get();
    let newTabs = [];
    let newConfig = Array(config_file.length).fill({});

    const newIndex = evt.newIndex;
    const oldIndex = evt.oldIndex;

    // let queueGroupsSort = Array(config_file.length).fill({});
    const groups = document.getElementById('tabs').getElementsByClassName('group');
    for (let i = 0; i < groups.length; i++) {
      const oldGroupId = groups[i].id.split("_")[1];
      const groupIndex = get_index_group_by_id(oldGroupId);
      newTabs.push(TABS[groupIndex]);
      newConfig[i] = config_file[groupIndex];
    }

    TABS = newTabs;
    for (let i = 0; i < groups.length; i++) {
      groups[i].id = `group_${i}`;
      groups[i].getElementsByClassName('tabs_items')[0].id = `items_${i}`;
      groups[i].getElementsByClassName('indicator')[0].id = `group_indicator_${i}`;
      TABS[i].id = i;
    }

    updateGroupsIds([...Array(groups.length).keys()]);
    connectionsStore.set(newConfig);

  }
});

/*----------------------------------------------------------------------------*/

function tabs_context(data, id) {
  const ids = id.split("_");
  switch (data) {
    case "Connect":
      document.getElementById(`iframe_${id}`).contentWindow.connect();
      break;
    case "Disconnect":
      document.getElementById(`iframe_${id}`).contentWindow.disconnect();
      break;
    case "Edit":
      alert_create_edit_connection(ids[0], ids[1], undefined, true)
      break;
    case "Duplicate":

      break;
    case "Delete":
      alert_delete_connection(ids[0], ids[1], event=undefined, return_flag=false);
      break;
    default:
      break;
  }
}

/*----------------------------------------------------------------------------*/

ipcRenderer.on('context-menu-command', (e, command) => {
  if (command.target == "connection") {
    eval(`document.getElementById("iframe_${command.id}").contentWindow.${command.function}("${command.action}")`);
  } else {
    eval(`${command.function}("${command.action}", "${command.arg}")`);
  }
})

ipcRenderer.on('save-files-folder-dialog-command', (e, command) => {
  if (command.target == "connection") {
    eval(`document.getElementById("iframe_${command.id}").contentWindow.${command.function}(${JSON.stringify(command.result)})`);
  }
})
