
function alert_create_connection() {
  open_alert(`
    <p class="name">Create a new connection</p>
    <hr>
    <input id="name" class="input_style" type="text" placeholder="name">
    <input id="host" class="input_style" type="text" placeholder="host">
    <input id="port" class="input_style" type="text" placeholder="port">
    <input id="login" class="input_style" type="text" placeholder="login">
    <br>
    <input id="password" class="input_style" type="password" placeholder="password">
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

  var error_flag = false;
  for (const el of [name, host, port, login, password]) {
    if (el.value.length < 1) {
      el.className = "input_style input_warning";
      error_flag = true;
    } else {
      el.className = "input_style";
    }
  }
  if (error_flag) return;

  var config_file = JSON.parse(JSON.stringify(require(`./${CONNECTIONS_FILE}`)));
  config_file["connections"].push({
    "name": name.value,
    "host": host.value,
    "port": port.value,
    "username": login.value,
    "password": password.value
  });

  fs.writeFile(
    `./${CONNECTIONS_FILE}`,
    JSON.stringify(
      config_file,
      null,
      2
    ),
    (err) => err && console.error(err)
  );

  try {
    TABS.push({
      "id": `${Number(TABS[TABS.length - 1].id) + 1}`,
      "name": name.value
    });
    append_tab(
      config_file["connections"][config_file["connections"].length - 1],
      TABS[TABS.length - 1].id
    );

  } catch (e) {
    console.warn(e);
  }

  select_tab(TABS[TABS.length - 1].id);

  close_alert();
}

function alert_delete_connection(id) {
  open_alert(`
    <p class="name_delete">Delete connection?</p>
    <p class="delete_info">The '${TABS[get_index_by_id(id)].name}' connection is selected for deletion. The current session with this connection will be terminated.</p>
    <div class="button delete" onclick="delete_connection(${id})">
      <p>Delete forever</p>
    </div>
  `, "delete_alert")
}

function delete_connection(id) {
  var index = get_index_by_id(id);
  fs.readFile(`./${CONNECTIONS_FILE}`, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const config_file = JSON.parse(data)
    config_file.connections.splice(index, 1);
    fs.writeFile(
      `./${CONNECTIONS_FILE}`,
      JSON.stringify(
        config_file,
        null,
        2
      ),
      (err) => err && console.error(err)
    );
  });

  TABS.splice(index, 1);
  document.getElementById(id + "_menu").remove();
  document.getElementById(id + "_body").remove();
  document.getElementById(id + "_line").remove();
  document.getElementById(id + "_li").remove();


  close_alert();
}
