
function generateRandomName() {
  const adjectives = ['Red', 'Blue', 'Green', 'Happy', 'Sunny', 'Clever', 'Swift'];
  const nouns = ['Elephant', 'Mountain', 'Ocean', 'Robot', 'Tree', 'Star', 'Hero'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomName = `${randomAdjective} ${randomNoun}`;
  return randomName;
}

function alert_create_connection() {
  open_alert(`
    <p class="name">Create a new connection</p>
    <hr>
    <input id="name" class="input_style" type="text" placeholder="Connection name">
    <p class="name_info">A random name is generated if you do not provide one.</p>
    <p class="connection_page_name">Connection</p>
    <input id="host" class="input_style" type="text" placeholder="host">
    <input id="port" class="input_style" type="text" placeholder="port">
    <p class="port_info">Default port 22</p>
    <p class="connection_page_name_auth">Authorization data</p>
    <input id="login" class="input_style" type="text" placeholder="login">
    <input id="password" class="input_style" type="password" placeholder="password">
    <p class="connection_page_name">Command</p>
    <textarea id="first_command" class="input_style" type="text" placeholder="Command (For example: clear & python3)"></textarea>
    <p class="first_command_info">Command to be executed on the server after connection (optional).</p>
    <div class="button submit" onclick="create_connection()">
      <p>Create</p>
    </div>
  `, "alert")
}

// alert_create_connection();

function create_connection() {
  var name = document.getElementById("name");
  var host = document.getElementById("host");
  var port = document.getElementById("port");
  var login = document.getElementById("login");
  var password = document.getElementById("password");
  var first_command = document.getElementById("first_command");

  var error_flag = false;
  for (const el of [host, login, password]) {
    if (el.value.length < 1) {
      el.className = "input_style input_warning";
      error_flag = true;
    } else {
      el.className = "input_style";
    }
  }
  if (error_flag) return;

  var config_file = store.get('connections');

  config_file.push({
    "name": (name.value.length > 0)? name.value: generateRandomName(),
    "host": host.value,
    "port": (port.value.length > 0)? port.value: "22",
    "username": login.value,
    "password": password.value,
    "first_command": btoa(first_command.value)
  });

  store.set('connections', config_file);

  try {
    TABS.push({
      "id": `${(TABS.length > 0)? (Number(TABS[TABS.length - 1].id) + 1): "1"}`,
      "name": name.value,
      "host": host.value,
      "port": port.value,
      "username": login.value,
      "password": password.value,
      "first_command": btoa(first_command.value),
      "search": name.value + host.value + ":" + port.value
    });
    append_tab(
      config_file[config_file.length - 1],
      TABS[TABS.length - 1].id
    );
  } catch (e) {
    console.warn(e);
  }

  select_tab(TABS[TABS.length - 1].id);
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

/*----------------------------------------------------------------------------*/

function alert_edit_connection(id, event) {
  console.log(atob(TABS[get_index_by_id(id)].first_command));
  var index = get_index_by_id(id);
  open_alert(`
    <p class="name">Edit connection</p>
    <hr>
    <input id="name" class="input_style" type="text" placeholder="Connection name" value="${TABS[get_index_by_id(id)].name}">
    <p class="name_info">A random name is generated if you do not provide one.</p>
    <p class="connection_page_name">Connection</p>
    <input id="host" class="input_style" type="text" placeholder="host" value="${TABS[get_index_by_id(id)].host}">
    <input id="port" class="input_style" type="text" placeholder="port" value="${TABS[get_index_by_id(id)].port}">
    <p class="port_info">Default port 22</p>
    <p class="connection_page_name_auth">Authorization data</p>
    <input id="login" class="input_style" type="text" placeholder="login" value="${TABS[get_index_by_id(id)].username}">
    <input id="password" class="input_style" type="password" placeholder="password" placeholder="password" value="${TABS[get_index_by_id(id)].password}">
    <p class="connection_page_name">Command</p>
    <textarea id="first_command" class="input_style" type="text" placeholder="Command (For example: clear & python3)" placeholder="password">${atob(TABS[get_index_by_id(id)].first_command)}</textarea>
    <p class="first_command_info">Command to be executed on the server after connection (optional).</p>
    <div class="button submit" onclick="edit_connection(${id})">
      <p>Save</p>
    </div>
  `, "alert");
  if (event) {
    event.stopPropagation();
  }
}

function edit_connection(id) {
  var index = get_index_by_id(id);
  var name = document.getElementById("name");
  var host = document.getElementById("host");
  var port = document.getElementById("port");
  var login = document.getElementById("login");
  var password = document.getElementById("password");
  var first_command = document.getElementById("first_command");

  var error_flag = false;
  for (const el of [host, login, password]) {
    if (el.value.length < 1) {
      el.className = "input_style input_warning";
      error_flag = true;
    } else {
      el.className = "input_style";
    }
  }
  if (error_flag) return;

  var config_file = store.get('connections');
  config_file[index] = {
    "name": (name.value.length > 0)? name.value: generateRandomName(),
    "host": host.value,
    "port": (port.value.length > 0)? port.value: "22",
    "username": login.value,
    "password": password.value,
    "first_command": btoa(first_command.value)
  };

  store.set('connections', config_file);

  try {
    TABS[index].name = config_file[index].name;
    TABS[index].host = config_file[index].host;
    TABS[index].port = config_file[index].port;
    TABS[index].username = config_file[index].username;
    TABS[index].password = config_file[index].password;
    TABS[index].first_command = config_file[index].first_command;
    TABS[index].search = name.value + host.value + ":" + port.value;

    document.getElementById(id + "_menu").innerHTML = generate_tab_by_data(config_file[index], id);
    document.getElementById(id + "_li").innerHTML = `<iframe src='ssh.html?data=${JSON.stringify(config_file[index])}&config=${JSON.stringify(SETTINGS_DICT)}&id=${id}' style="display: none" id="${id + "_body"}"></div>`;
    document.getElementById(id + "_body").contentWindow.update_status = update_status;

  } catch (e) {
    console.warn(e);
  }

  select_tab(id);
  close_alert();
}
