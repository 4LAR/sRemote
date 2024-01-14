
function generateRandomName() {
  const adjectives = ['Red', 'Blue', 'Green', 'Happy', 'Sunny', 'Clever', 'Swift'];
  const nouns = ['Elephant', 'Mountain', 'Ocean', 'Robot', 'Tree', 'Star', 'Hero'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomName = `${randomAdjective} ${randomNoun}`;
  return randomName;
}

const AUTH_SCHEMAS = [
  "lap",
  "lak"
]

function change_auth_scheme() {
  var auth_scheme = document.getElementById("auth_scheme").value;
  for (const el of AUTH_SCHEMAS) {
    if (el == auth_scheme) {
      openModal(`auth_scheme_input_${el}`);
    } else {
      closeModal(`auth_scheme_input_${el}`);
    }
  }
}

function alert_create_edit_connection(id, event, edit_flag=false) {
  open_alert(`
    <p class="name">${(edit_flag)? "Edit connection": "Create a new connection"}</p>
    <hr>
    <input id="name" class="input_style" type="text" placeholder="Connection name">
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
    <div class="button submit" onclick="${(edit_flag)? `save_data_connection(${id}, true)`: "save_data_connection()"}">
      <p>${(edit_flag)? "Save": "Create"}</p>
    </div>
  `, "alert")

  if (edit_flag) {
    document.getElementById("name").value = TABS[get_index_by_id(id)].name;
    document.getElementById("host").value = TABS[get_index_by_id(id)].host;
    document.getElementById("port").value = TABS[get_index_by_id(id)].port;
    document.getElementById("auth_scheme").value = TABS[get_index_by_id(id)].auth_scheme;
    change_auth_scheme();
    console.log(TABS[get_index_by_id(id)].auth_scheme);
    if (TABS[get_index_by_id(id)].auth_scheme == "lap") {
      document.getElementById("login_lap").value = TABS[get_index_by_id(id)].username;
      document.getElementById("password").value = TABS[get_index_by_id(id)].password;
    } else if (TABS[get_index_by_id(id)].auth_scheme == "lak") {
      document.getElementById("login_lak").value = TABS[get_index_by_id(id)].username;
      document.getElementById("privateKey").value = TABS[get_index_by_id(id)].privateKey;
    }
    document.getElementById("first_command").value = atob(TABS[get_index_by_id(id)].first_command);
  }

  document.getElementById('PrivateKeyInput').addEventListener('change', (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      document.getElementById("privateKey").value = selectedFile.path;
    }
  });

  if (event) {
    event.stopPropagation();
  }
}

// alert_create_edit_connection(undefined, undefined, false);

function save_data_connection(id, edit_flag=false) {
  var name = document.getElementById("name");
  var host = document.getElementById("host");
  var port = document.getElementById("port");
  var login_lap = document.getElementById("login_lap");
  var login_lak = document.getElementById("login_lak");
  var auth_scheme = document.getElementById("auth_scheme");
  var password = document.getElementById("password");
  var privateKey = document.getElementById("privateKey");
  var first_command = document.getElementById("first_command");

  var error_flag = false;
  for (const el of ((auth_scheme.value == "lap")? [host, login_lap, password]: [host, login_lak, privateKey])) {
    if (el.value.length < 1) {
      el.className = "input_style input_warning";
      error_flag = true;
    } else {
      el.className = "input_style";
    }
  }
  if (error_flag) return;

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

  var config_file = store.get('connections');

  if (edit_flag) {
    var index = get_index_by_id(id);
    config_file[index] = insert_data;

    try {
      TABS[index].name = insert_data.name;
      TABS[index].host = insert_data.host;
      TABS[index].port = insert_data.port;
      TABS[index].auth_scheme = insert_data.auth_scheme;
      TABS[index].username = insert_data.username;
      TABS[index].password = insert_data.password;
      TABS[index].privateKey = insert_data.privateKey;
      TABS[index].first_command = insert_data.first_command;
      TABS[index].search = insert_data.name + insert_data.host + ":" + insert_data.port;

      document.getElementById(id + "_menu").innerHTML = generate_tab_by_data(insert_data, id);
      document.getElementById(id + "_li").innerHTML = `<iframe src='ssh.html?data=${JSON.stringify(insert_data)}&config=${JSON.stringify(SETTINGS_DICT)}&id=${id}&data_path=${path.dirname(store.path)}' style="display: none" id="${id + "_body"}"></div>`;
      document.getElementById(id + "_body").contentWindow.update_status = update_status;

    } catch (e) {
      console.warn(e);
    }

    select_tab(id);
  } else {
    config_file.push(insert_data);

    try {
      TABS.push({
        "id": `${(TABS.length > 0)? (Number(TABS[TABS.length - 1].id) + 1): "1"}`,
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
      append_tab(
        config_file[config_file.length - 1],
        TABS[TABS.length - 1].id
      );
    } catch (e) {
      console.warn(e);
    }

    select_tab(TABS[TABS.length - 1].id);
  }

  store.set('connections', config_file);

  close_alert();
}

/*----------------------------------------------------------------------------*/

function alert_delete_connection(id, event) {
  open_alert(`
    <p class="name_delete">Delete connection?</p>
    <p class="delete_info">The '${TABS[get_index_by_id(id)].name}' connection is selected for deletion. The current session with this connection will be terminated.</p>
    <div class="button delete" onclick="delete_connection(${id})">
      <p>Delete forever</p>
    </div>
  `, "delete_alert");
  if (event) {
    event.stopPropagation();
  }
}

function delete_connection(id) {
  var index = get_index_by_id(id);
  var config_file = store.get('connections');
  config_file.splice(index, 1);
  store.set('connections', config_file);

  TABS.splice(index, 1);
  document.getElementById(id + "_menu").remove();
  document.getElementById(id + "_body").remove();
  document.getElementById(id + "_line").remove();
  document.getElementById(id + "_li").remove();

  close_alert();
}
