
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
  `, big=false)
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
      "id": `${Number(TABS[TABS.length - 1].id) + 1}`
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
