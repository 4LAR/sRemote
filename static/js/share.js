

function share(group_id, item_id=undefined) {
  const config_file = store.get('connections');
  var save_data = {};
  var name = "";
  if (item_id) {
    var index = get_indexes_by_id(group_id, item_id);
    name = config_file[index[0]].items[index[1]].name;
    save_data = {
      "type": "connection",
      "data": config_file[index[0]].items[index[1]]
    };
  } else {
    var index = get_index_group_by_id(group_id);
    name = config_file[index].name;
    save_data = {
      "type": "group",
      "data": config_file[index]
    };
  }

  ipcRenderer.send('save-connection-dialog', {
    name: name,
    data: save_data
  });
}

/*----------------------------------------------------------------------------*/

// окно с информацией о импорте
function alert_import_connection(data) {
  var group_flag = data.type === "group"
  if (group_flag) {
    open_alert(`
      <p class="name">Import group</p>
      <hr>
      <input id="name" class="input_style" type="text" placeholder="Group name">
      <p class="name_info">A random name is generated if you do not provide one.</p>

      <div class="button submit" id="import_button">
        <p>Import</p>
      </div>
    `, "alert_import_group");

      document.getElementById("name").value = data.data.name;
      document.getElementById("import_button").onclick = function() {
        import_data(data.type, data.data)
      }
  } else {

  }
}

// импорт
function import_data(type, data) {
  var name = document.getElementById("name");
  var config_file = store.get('connections');
  if (type === "group") {
    // импорт групп
    try {
      var insert_data = {
        "id": (TABS.length > 0)? (Number(TABS[TABS.length - 1].id) + 1): 0,
        "name": (name.value.length > 0)? name.value: generateRandomName(),
        "open_flag": false,
        "items": []
      };

      config_file.push({
        "name": insert_data.name,
        "open_flag": false,
        "items": data.items
      });

      TABS.push(insert_data)
      append_to_ul(
        "tabs",
        generate_group_data(insert_data, insert_data.id),
        undefined,
        `group_${insert_data.id}`,
        className="group"
      );

      var item_id = -1;
      for (item of data.items) {
        item_id++;
        TABS[insert_data.id].items.push({
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
        append_item(item, insert_data.id, item_id);
      }
      auto_height_items(insert_data.id);
    } catch (e) {
      console.warn(e);
    }
  } else {
    // импорт соединений

  }
  store.set('connections', config_file);
  close_alert();
}

// чтение файла для импорта
function read_import_file(file_path) {
  var obj;
  fs.readFile(file_path, 'utf8', function (err, data) {
    if (err) throw err;
    obj = JSON.parse(data);
    console.log(obj);
    alert_import_connection(obj);
  });
}

/*----------------------------------------------------------------------------*/

ipcRenderer.on('file-open', (event, file) => {
  read_import_file(file);
});

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.body;

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = event.dataTransfer.files;

    if (files.length > 0) {
      const filePath = files[0].path;
      read_import_file(filePath);
    }
  });
});
