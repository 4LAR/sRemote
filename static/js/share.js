

function share(group_id, item_id=undefined) {
  const config_file = store.get('connections');
  var save_data = {};
  var name = "";
  if (item_id !== undefined) {
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
    var selector = {};
    for (const el of TABS) {
      selector[el.name] = el.id;
    }
    open_alert(`
      <p class="name">Import connection</p>
      <hr>
      ${select_generator(selector, "group_name", "input_style")}
      <input id="name_connection" class="input_style" type="text" placeholder="Connection name">
      <p class="name_info">A random name is generated if you do not provide one.</p>
      <p class="connection_page_name">Connection</p>
      <input id="host" class="input_style" type="text" placeholder="host">
      <input id="port" class="input_style" type="text" placeholder="port">
      <p class="port_info">Default port 22</p>
      <p class="connection_page_name_auth">Authorization data: </p>
      <select id="auth_scheme" class="connection_auth_scheme" onchange="change_auth_scheme()" tabindex="-1">
        <option value="lap" selected>login and password</option>
        <option value="lak">login and privateKey</option>
      </select>
      <div id="auth_scheme_input_lap">
        <input id="login_lap" class="input_style" type="text" placeholder="login">
        <input id="password" class="input_style" type="password" placeholder="password">
      </div>
      <div id="auth_scheme_input_lak" style="display: none">
        <input id="login_lak" class="input_style" type="text" placeholder="login">
        <input id="privateKey" class="input_style" type="text" placeholder="private key path">
        <input type="file" id="PrivateKeyInput" accept=".ppk" style="display: none;">
        <div class="option" onclick="document.getElementById('PrivateKeyInput').click()">
          <div></div>
          <p>...</p>
        </div>

      </div>
      <p class="connection_page_name">Command</p>
      <textarea id="first_command" class="input_style" type="text" placeholder="Command (For example: clear & python3)"></textarea>
      <p class="first_command_info">Command to be executed on the server after connection (optional).</p>
      <div class="button submit" id="import_button">
        <p>Import</p>
      </div>
    `, "alert_import_connection");

    document.getElementById("name_connection").value = data.data.name;
    document.getElementById("host").value = data.data.host;
    document.getElementById("port").value = data.data.port;
    document.getElementById("auth_scheme").value = data.data.auth_scheme;
    change_auth_scheme();
    if (data.data.auth_scheme == "lap") {
      document.getElementById("login_lap").value = data.data.username;
      document.getElementById("password").value = data.data.password;
    } else if (data.data.auth_scheme == "lak") {
      document.getElementById("login_lak").value = data.data.username;
      document.getElementById("privateKey").value = data.data.privateKey;
    }
    document.getElementById("first_command").value = atob(data.data.first_command);

    document.getElementById("import_button").onclick = function() {
      import_data(data.type, data.data)
    }

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
    try {
      var group_id = document.getElementById("group_name").value;
      var name = document.getElementById("name_connection");
      var host = document.getElementById("host");
      var port = document.getElementById("port");
      var login_lap = document.getElementById("login_lap");
      var login_lak = document.getElementById("login_lak");
      var auth_scheme = document.getElementById("auth_scheme");
      var password = document.getElementById("password");
      var privateKey = document.getElementById("privateKey");
      var first_command = document.getElementById("first_command");

      var insert_data = {
        "name": (name.value.length > 0)? name.value: generateRandomName(),
        "host": host.value,
        "port": (port.value.length > 0)? port.value: "22",
        "auth_scheme": auth_scheme.value,
        "username": (auth_scheme.value == "lap")? login_lap.value: login_lak.value,
        "password": password.value,
        "privateKey": privateKey.value,
        "first_command": btoa(first_command.value)
      }
      var index = get_index_group_by_id(group_id);
      config_file[index].items.push(insert_data);

      TABS[index].items.push({
        "id": `${(TABS[index].items.length > 0)? (Number(TABS[index].items[TABS[index].items.length - 1].id) + 1): "1"}`,
        "name": insert_data.name,
        "host": insert_data.host,
        "port": insert_data.port,
        "auth_scheme": insert_data.auth_scheme,
        "username": insert_data.username,
        "password": insert_data.password,
        "privateKey": insert_data.privateKey,
        "first_command": insert_data.first_command,
        "search": insert_data.name + insert_data.host + ":" + insert_data.port
      });

      var new_item_id = TABS[index].items[TABS[index].items.length - 1].id;
      append_item(
        config_file[index].items[config_file[index].items.length - 1],
        group_id,
        new_item_id
      )

      select_item(group_id, new_item_id);
      auto_height_items(group_id);
    } catch (e) {
      console.warn(e);
    }
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
