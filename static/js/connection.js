
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

const DATA_GROUP_TO_READ = [
  { key: "uuid", default: uuid },
  { key: "name", default: generateRandomName() },
  { key: "open_flag", default: false }
]

const DATA_CONNECTION_TO_READ = [
  { key: "uuid", default: uuid },
  { key: "ico", default: "terminal" },
  { key: "name", default: "TEST" },
  { key: "host", default: "0.0.0.0" },
  { key: "port", default: "22" },
  { key: "auth_scheme", default: "lap" },
  { key: "username", default: "user" },
  { key: "password", default: "password" },
  { key: "privateKey", default: "" },
  { key: "first_command", default: "" },
  { key: "multitab_terminal", default: false },
  { key: "root", default: false }
];

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

function show_password(id, indicator_id) {
  var input = document.getElementById(id);
  var indicator = document.getElementById(indicator_id);
  if (input.type === "password") {
    input.type = "text";
    indicator.src = "./static/img/unsee.svg";
  } else {
    input.type = "password";
    indicator.src = "./static/img/see.svg";
  }
}

function alert_create_edit_connection_event(event) {
  alert_create_edit_connection(...get_ids_from_event(event), event, true);
}

function eventImageSelector(element) {
  const mainObj = element.parentElement;
  if (element.className == "hitbox") {
    mainObj.classList.add("opened");
    return;
  }

  const optionsList = Array.from(element.parentElement.getElementsByTagName('DIV')).filter(element => !element.classList.contains("hitbox"));

  for (const option of optionsList)
    option.classList.remove("selected");

  element.classList.add("selected");
  mainObj.classList.remove("opened");
}

function select_image(id="", image="") {
  const mainObj = document.getElementById(id);

  const optionsList = Array.from(mainObj.getElementsByTagName('DIV')).filter(element => !element.classList.contains("hitbox"));

  for (const option of optionsList) {
    const srcImage = option.getElementsByTagName("IMG")[0].src.split("/");
    if (srcImage[srcImage.length - 1].split(".")[0] == image) {
      option.classList.add("selected");
    } else {
      option.classList.remove("selected");
    }
  }
}

function get_selector_icons(id="") {
  const mainObj = document.getElementById(id);

  const selected = Array.from(mainObj.getElementsByTagName('DIV')).filter(element => !element.classList.contains("hitbox") && element.classList.contains("selected"))[0];
  const srcImage = selected.getElementsByTagName("IMG")[0].src.split("/");
  return srcImage[srcImage.length - 1].split(".")[0];
}

function generate_selector_icons(id="", selected=undefined) {
  const icons = [
    "terminal",
    "server",
    "git",
    "notebook",
    "wheelchair",
    "cloud",
    "lock",
    "docker"
  ];

  let result = "";
  let first = true;
  for (const ico of icons) {
    var selected_flag = false;
    if (first && !selected) {
      selected_flag = true;
    } else if (!!selected && ico == selected) {
      selected_flag = true;
    }
    result += `
      <div class="${(selected_flag)? "selected": ""}" onclick="eventImageSelector(this)">
        <img src="./static/img/type/${ico}.svg">
      </div>
    `;
    first = false;
  }

  return `
    <div class="select-image scroll_style" id="${id}">
      <div class="hitbox" onclick="eventImageSelector(this)"></div>
      ${result}
    </div>
  `
}

function alert_create_edit_connection(group_id, item_id, event, edit_flag=false) {
  if (group_id === undefined)
    group_id = get_id_group_from_event(event);
  open_alert(
    "static/alerts/create_edit_connection.html",
    "alert",
    undefined,
    {
      ...window,
      group_id,
      item_id,
      edit_flag
    }
  );
  document.getElementById("connectioname").focus()
  if (edit_flag) {
    var index = get_indexes_by_id(group_id, item_id);
    const item = TABS[index[0]].items[index[1]];
    select_image("ico", item.ico);
    document.getElementById("connectioname").value = item.name;
    document.getElementById("host").value = item.host;
    document.getElementById("port").value = item.port;
    document.getElementById("auth_scheme").value = item.auth_scheme;
    change_auth_scheme();
    if (item.auth_scheme == "lap") {
      document.getElementById("login_lap").value = item.username;
      document.getElementById("password").value = item.password;
    } else if (item.auth_scheme == "lak") {
      document.getElementById("login_lak").value = item.username;
      document.getElementById("privateKey").value = item.privateKey;
    }
    document.getElementById("first_command").value = atob(item.first_command);
    document.getElementById("multitab_terminal").checked = item.multitab_terminal;
    document.getElementById("root").checked = item.root;
  }

  document.getElementById('PrivateKeyInput').addEventListener('change', (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      document.getElementById("privateKey").value = selectedFile.path;
    }
  });

  connection_menu("general");

  if (event) {
    event.stopPropagation();
  }
}

const connection_settings_pages = [
  "general",
  "other"
];

function connection_menu(page_name) {
  for (const page of connection_settings_pages) {
    if (page == page_name) {
      document.getElementById(`connection_page_${page}`).style.display = "block";
      document.getElementById(`connection_menu_${page}`).className = "selected";
    } else {
      document.getElementById(`connection_page_${page}`).style.display = "none";
      document.getElementById(`connection_menu_${page}`).className = "";
    }
  }
}

// alert_create_edit_connection(undefined, undefined, false);

function save_data_connection(group_id, item_id, edit_flag=false) {
  const name = document.getElementById("connectioname");
  const host = document.getElementById("host");
  const port = document.getElementById("port");
  const login_lap = document.getElementById("login_lap");
  const login_lak = document.getElementById("login_lak");
  const auth_scheme = document.getElementById("auth_scheme");
  const password = document.getElementById("password");
  const privateKey = document.getElementById("privateKey");
  const first_command = document.getElementById("first_command");
  const ico = get_selector_icons("ico");
  const multitab_terminal = document.getElementById("multitab_terminal");
  const root = document.getElementById("root");

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
    "ico": ico,
    "uuid": uuid(),
    "name": (name.value.length > 0)? name.value: generateRandomName(),
    "host": host.value,
    "port": (port.value.length > 0)? port.value: "22",
    "auth_scheme": auth_scheme.value,
    "username": (auth_scheme.value == "lap")? login_lap.value: login_lak.value,
    "password": password.value,
    "privateKey": privateKey.value,
    "first_command": btoa(first_command.value),
    "multitab_terminal": multitab_terminal.checked,
    "root": root.checked
  }

  var config_file = connectionsStore.get();

  if (edit_flag) {
    var index = get_indexes_by_id(group_id, item_id);
    var item_in_TABS = config_file[index[0]].items[index[1]];
    insert_data.uuid = item_in_TABS.uuid;
    config_file[index[0]].items[index[1]] = insert_data;

    try {
      const item = TABS[index[0]].items[index[1]];
      item.ico = insert_data.ico;
      item.name = insert_data.name;
      item.host = insert_data.host;
      item.port = insert_data.port;
      item.auth_scheme = insert_data.auth_scheme;
      item.username = insert_data.username;
      item.password = insert_data.password;
      item.privateKey = insert_data.privateKey;
      item.first_command = insert_data.first_command;
      item.multitab_terminal = insert_data.multitab_terminal;
      item.root = insert_data.root;
      item.search = insert_data.name + insert_data.host + ":" + insert_data.port;

      document.getElementById(`item_${group_id}_${item_id}`).innerHTML = generate_item_by_data(insert_data, group_id, item_id);
      document.getElementById(`li_${group_id}_${item_id}`).innerHTML = `<iframe src='ssh.html?data=${JSON.stringify(insert_data)}&config=${JSON.stringify(SETTINGS_DICT)}&group_id=${group_id}&item_id=${item_id}&data_path=${path.dirname(store.path)}' style="display: none" id="iframe_${group_id}_${item_id}"></div>`;
      document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.update_status = update_status;
      document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.localization_dict = localization_dict;
      document.getElementById(`iframe_${group_id}_${item_id}`).contentWindow.mainHotkey = (e) => hotkeyStore.keydown(e, document.getElementById(`iframe_${group_id}_${item_id}`));;

    } catch (e) {
      console.warn(e);
    }

    select_item(group_id, item_id);
  } else {
    var index = get_index_group_by_id(group_id);
    config_file[index].items.push(insert_data);

    try {
      TABS[index].items.push({
        "id": `${(TABS[index].items.length > 0)? (Number(TABS[index].items[TABS[index].items.length - 1].id) + 1): "1"}`,
        "ico": ico,
        "name": insert_data.name,
        "host": insert_data.host,
        "port": insert_data.port,
        "auth_scheme": insert_data.auth_scheme,
        "username": insert_data.username,
        "password": insert_data.password,
        "privateKey": insert_data.privateKey,
        "first_command": insert_data.first_command,
        "multitab_terminal": insert_data.multitab_terminal,
        "root": insert_data.root,
        "search": insert_data.name + insert_data.host + ":" + insert_data.port
      });
      var new_item_id = TABS[index].items[TABS[index].items.length - 1].id;
      append_item(
        config_file[index].items[config_file[index].items.length - 1],
        group_id,
        new_item_id
      )
    } catch (e) {
      console.warn(e);
    }

    select_item(group_id, new_item_id);
    auto_height_items(group_id);
  }

  connectionsStore.set(config_file);

  close_alert();
}

/*----------------------------------------------------------------------------*/

//
function alert_delete_connection(group_id, item_id, event, return_flag=true) {
  const func = function() {
    var index = get_indexes_by_id(group_id, item_id);
    open_alert(
      "static/alerts/delete_connection.html",
      "delete_alert",
      function() {
        if (return_flag)
          alert_create_edit_connection(group_id, item_id, undefined, true);
      }, {
        ...window,
        group_id,
        item_id,
        index
      }
    );
  };
  if (return_flag) close_alert(true, func);
  if (event) event.stopPropagation();
}

//
function delete_connection(group_id, item_id) {
  var index = get_indexes_by_id(group_id, item_id);
  var config_file = connectionsStore.get();
  config_file[index[0]].items.splice(index[1], 1);
  connectionsStore.set(config_file);

  TABS[index[0]].items.splice(index[1], 1);
  document.getElementById(`item_${group_id}_${item_id}`).remove();
  document.getElementById(`iframe_${group_id}_${item_id}`).remove();
  // document.getElementById(`line_${group_id}_${item_id}`).remove();
  document.getElementById(`li_${group_id}_${item_id}`).remove();

  auto_height_items(group_id);
  close_alert(false);
}

/*----------------------------------------------------------------------------*/

function alert_edit_create_group(event=undefined, edit_flag=false) {
  const group_id = (event)? get_id_group_from_event(event): 0;
  open_alert(
    "static/alerts/edit_create_group.html",
    "alert_group",
    undefined,
    {
      ...window,
      edit_flag,
      group_id
    }
  );

  document.getElementById("name").focus()

  if (edit_flag) {
    var index = get_index_group_by_id(group_id);
    document.getElementById("name").value = TABS[index].name;
  }

  if (event) {
    event.stopPropagation();
  }
}

function save_data_group(group_id, edit_flag=false) {
  var name = document.getElementById("name");
  var config_file = connectionsStore.get();
  if (edit_flag) {
    var index = get_index_group_by_id(group_id);
    try {
      TABS[index].name = name.value;
      document.getElementById(`group_${group_id}`).getElementsByTagName('p')[0].innerHTML = name.value;

      config_file[index].name = name.value;
    } catch (e) {
      console.warn(e);
    }
  } else {
    try {
      const new_uuid = uuid();
      var insert_data = {
        "id": (TABS.length > 0)? (Number(TABS[TABS.length - 1].id) + 1): 0,
        "uuid": new_uuid,
        "name": (name.value.length > 0)? name.value: generateRandomName(),
        "open_flag": false,
        "items": []
      };

      config_file.push(insert_data);

      TABS.push({
        "id": (TABS.length > 0)? (Number(TABS[TABS.length - 1].id) + 1): 0,
        ...insert_data
      })
      append_group(insert_data, insert_data.id);
    } catch (e) {
      console.warn(e);
    }
  }
  connectionsStore.set(config_file);
  close_alert();
}

/*----------------------------------------------------------------------------*/

function alert_delete_group(group_id, event) {
  const func = function() {
    var index = get_index_group_by_id(group_id);
    open_alert(
      "static/alerts/delete_group.html",
      "delete_alert",
      function() {
        alert_edit_create_group(
          {
            target: {
              parentElement: {
                id: `_${group_id}`
              }
            },
            stopPropagation: function() {}
          },
          true
        );
      }, {
        ...window,
        group_id,
        index
      }
    );
  };
  close_alert(true, func);
  if (event) event.stopPropagation();
}

function delete_group(group_id) {
  var index = get_index_group_by_id(group_id);
  var config_file = connectionsStore.get();
  for (const item of TABS[index].items) {
    try {
      var index_item = get_indexes_by_id(group_id, item.id);
      config_file[index].items.splice(index[1], 1);
      TABS[index].items.splice(index_item[1], 1);

      document.getElementById(`item_${group_id}_${item.id}`).remove();
      document.getElementById(`iframe_${group_id}_${item.id}`).remove();
      // document.getElementById(`line_${group_id}_${item.id}`).remove();
      document.getElementById(`li_${group_id}_${item.id}`).remove();
    } catch (e) {
      console.warn(e)
    }
  }
  TABS.splice(index, 1);
  config_file.splice(index, 1);
  connectionsStore.set(config_file);
  document.getElementById(`group_${group_id}`).remove();

  close_alert(false);
}
