let connected_flag = false;

function local_update_status(set_status) {
  status = set_status;
  update_status(group_id, item_id, status);
}

// переносит каретку если строка не пустая
function newLine(term) {
  const currentRow = term.buffer.active.getLine(term.buffer.cursorY);
  if (!currentRow?.isWrapped) {
    term.write('\r\n');
  }
}

// вывод линии в терминал (переносит каретку если строка не пустая)
function printOnNewLine(term, text) {
  newLine(term);
  term.write(text);
}

// разбор ошибки и вывод её в терминал
function assembly_error(err) {
  let text = "";
  switch (err.level) {
    case "client-socket":
      text = `[\x1b[31mERROR\x1b[0m] Failed to connect to the remote server. (${err.code})`;
      break;
    case "client-authentication":
      text = `[\x1b[31mERROR\x1b[0m] Invalid credentials for authentication.`;
      break;
    default:
      text = `[\x1b[31mERROR\x1b[0m] ${err.level}`;
      break;
  }
  for (const shell of shellManager.shells) {
    printOnNewLine(shell.terminal, text);
  }
}

// копирование вставка
function customKeyEventHandler(e, term) {
  if (e.type !== "keydown") {
    return true;
  }
  if (e.ctrlKey && e.shiftKey) {
    const code = e.code;
    if (code === "KeyV") {
      navigator.clipboard.readText().then((toPaste) => {
        term.writeText(toPaste);
      });
      return false;
    } else if (code === "KeyC" || code === "KeyX") {
      const toCopy = term.getSelection();
      navigator.clipboard.writeText(toCopy);
      term.focus();
      return false;
    }
  }
  return true;
}

class ShellManager {
  current_shell = 1;
  count_create_shells = 0;
  shells = [];
  connect_flag = false;
  conn = undefined;
  stop = true;

  constructor(connection_config, config, thame) {
    this.connection_config = connection_config;
    this.config = config;
    this.thame = thame;
    this.conn = new Client();

    this.conn.on('ready', () => {
      connected_flag = true;
      for (let index = 0; index < this.shells.length; index++) {
        if (this.shells[index] !== undefined)
          this.connect_shell(index, () => {
            this.fit();
            newLine(this.shells[index].terminal);
          });
      }
      local_update_status(3);

    }).on('end', function() {
      connected_flag = false;
      local_update_status(0);
    }).on('error', function(err) {
      assembly_error(err);
      console.error(err);
      local_update_status(1);
      connected_flag = false;
    })
  }

  connect() {
    local_update_status(2);
    this.conn.connect({
      host: this.connection_config.host,
      port: this.connection_config.port,
      username: this.connection_config.username,
      password: (!this.connection_config.auth_scheme || this.connection_config.auth_scheme == "lap")? this.connection_config.password: undefined,
      privateKey: (this.connection_config.auth_scheme == "lak")? readFileSync(this.connection_config.privateKey): undefined,
      readyTimeout: this.config.Connections.readyTimeout,
      keepaliveCountMax: this.config.Connections.keepaliveCountMax,
      keepaliveInterval: this.config.Connections.keepaliveInterval
    });
  }

  disconnect() {
    this.connect_flag = false;
    this.conn.end();
  }

  focus(id=undefined) {
    const index = this._get_index_by_id((id !== undefined)? id: this.current_shell);
    this.shells[index].terminal.focus();
  }

  fit(id=undefined) {
    for (const shell of this.shells) {
      if ((id !== undefined)? (shell.id == id): shell.id == this.current_shell) {
        shell.fit.fit();
        try {
          shell.stream.setWindow(shell.terminal.rows, shell.terminal.cols);
        } catch (e) {
        }
        return;
      }
    }
  }

  add_shell(name=undefined, auto_connect=true) {
    if (auto_connect) {
      if (!connected_flag) {
        return false;
      }
    }

    let current_id = ++this.count_create_shells;

    //
    let inserted_id = this.shells.push({
      id: current_id,
      terminal: new Terminal({
        cursorBlink: true,
        macOptionIsMeta: true,
      }),
      fit: new FitAddon.FitAddon(),
      shell: undefined,
      stream: undefined
    }) - 1;
    let term = this.shells[inserted_id].terminal;

    //
    const tabs_list = document.getElementById('tabs_list').getElementsByClassName('container')[0];
    var div = document.createElement("div");
    div.innerHTML = `
      <input type="text" value="${(name === undefined)? `Terminal ${current_id}`: name}" default-text="${`Terminal ${current_id}`}" readonly>
      <img src="./static/img/plus.svg">
    `;
    div.id = `tab_${current_id}`;
    div.onmousedown = (event) => {
      if (event.button === 1) {
        event.preventDefault();
        this.close_tab(current_id);
      }
    }
    if (tabs_list.getElementsByTagName('DIV').length < 1) {
      div.className = "selected";
    }
    div.onclick = function() {
      open_tab(current_id);
    };
    div.ondblclick = function(event) {
      event.preventDefault();
      const input = div.getElementsByTagName('INPUT')[0];
      input.readOnly = false;
      input.focus();
      input.select();
    };
    div.getElementsByTagName('INPUT')[0].addEventListener('input', function() {
      const width = calculateWidthInput(this);
      this.style.width = Math.min(Math.max(100, width), 500) + 'px';
    });
    div.getElementsByTagName('INPUT')[0].addEventListener('blur', function() {
      this.readOnly = true;
      if (this.value.length < 1) {
        this.value = this.getAttribute('default-text');
      }
    });
    div.getElementsByTagName('INPUT')[0].addEventListener('keydown', function(event){
      if (event.key === 'Enter') {
        this.blur();
      }
    });
    div.getElementsByTagName('IMG')[0].onclick = (event) => {
      this.close_tab(current_id);
    };
    tabs_list.appendChild(div);

    //
    if (this.thame !== undefined)
      term.setOption('theme', light_thame);

    term.loadAddon(this.shells[inserted_id].fit);
    term.loadAddon(new SearchAddon.SearchAddon());
    term.attachCustomKeyEventHandler((e) => {customKeyEventHandler(e, term)});

    const terminal_list = document.getElementById('terminal_list');
    var terminal_div = document.createElement("div");
    terminal_div.id = `terminal_${current_id}`;
    terminal_list.appendChild(terminal_div);
    term.open(terminal_div);
    term.resize(100, 50);

    //
    if (auto_connect) {
      this.connect_shell(inserted_id, function() {
        open_tab(current_id);
      });
    } else {
      open_tab(current_id);
    }
    return current_id;
  }

  _get_index_by_id(id) {
    for (let index = 0; index < this.shells.length; index++) {
      if (this.shells[index].id == id) {
        return index;
      }
    }
    return -1;
  }

  close_tab(id) {
    if (this.shells.length < 2)
      return;

    //
    const index = this._get_index_by_id(id);
    if (this.current_shell == id) {
      const tabs = Array.from(document.getElementById('tabs_list').getElementsByClassName('container')[0].getElementsByTagName('DIV'));
      const tabs_ids = tabs.map((x) => Number(x.id.split("_")[1]));
      const current_index = tabs_ids.indexOf(id);
      const tabs_ids_without = [...tabs_ids];
      tabs_ids_without.splice(current_index, 1);
      var open_id = "";
      if (tabs_ids_without.length < current_index + 1) {
        open_id = tabs_ids_without[current_index - 1];
      } else {
        open_id = tabs_ids_without[current_index];
      }
      open_tab(open_id);
    }

    //
    if (this.shells[index].terminal) {
      this.shells[index].terminal.dispose();
      delete this.shells[index].terminal;
    }
    if (this.shells[index].stream) {
      this.shells[index].stream.end();
      delete this.shells[index].stream;
    }
    document.getElementById(`tab_${id}`).remove();
    document.getElementById(`terminal_${id}`).remove();
    this.shells.splice(index, 1);
  }

  connect_shell(id, on_connect=undefined) {
    let term = this.shells[id].terminal;

    this.shells[id].shell = this.conn.shell((err, stream) => {
      if (err) {
        this.close_tab(this.shells[id].id);
        // this.count_create_shells--;
        return;
      };

      const onData_listener = term.onData(function(data) {
        stream.write(data);
      });

      this.shells[id].stream = stream;

      const ondata = stream.on('data', function(data) {
        term.write(data);
      });

      const onclose = stream.on('close', () => {
        if (connected_flag) {
          if (this.shells.length > 1) {
            this.close_tab(this.shells[id].id);
          } else {
            this.disconnect();
          }
        } else {
          onData_listener.dispose();
          ondata.close();
          onclose.close();
          printOnNewLine(term, `[\x1b[34mINFO\x1b[0m] ${localization_dict.ssh_host_terminated}`);
        }
      });

      if (on_connect !== undefined) {
        on_connect();
      }
    });
  }
}

shellManager = new ShellManager(
  connection_config = connection_config,
  config            = config,
  thame             = (config.General.thame == 'light')? light_thame: undefined
);

// подгон размера терминала под окно
function fitToscreen() {
  shellManager.fit();
}

// Фокусировка на терминале
function focusOnTerminal() {
  shellManager.focus();
}

function disconnect() {
  shellManager.disconnect();
}

function connect() {
  shellManager.connect();
}

function reconnect() {

}

window.onresize = debounce(fitToscreen, wait_ms);
