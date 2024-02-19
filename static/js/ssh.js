const { Client } = require('ssh2');
const { readFileSync } = require('fs');

const wait_ms = 50;

/*----------------------------------------------------------------------------*/

const CONNECTIONS_FILE = "connections.json"
var connection_config = JSON.parse(get_arg("data"));
var config = JSON.parse(get_arg("config"));
var group_id = get_arg("group_id");
var item_id = get_arg("item_id");

/*----------------------------------------------------------------------------*/
var data_path = get_arg("data_path");

const CACHE_PATH = `${data_path}\\terminal_cache\\${btoa(connection_config.search)}`;

if (config["Connections"]["cacheData"]) {
  const folderPath = data_path + "\\terminal_cache";
  if (!fs.existsSync(folderPath)) {
    fs.mkdir(folderPath, (err) => {
      if (err) {
        console.error('Error creating folder:', err);
      } else {
        console.log('Folder created successfully!');
      }
    });
  } else {
    console.log('Folder already exists.');
  }
}

/*----------------------------------------------------------------------------*/

function add_cache(newData) {
  // Читаем текущие данные из файла, если файл существует
  let existingData = '';
  if (fs.existsSync(CACHE_PATH)) {
    existingData = fs.readFileSync(CACHE_PATH, 'utf-8');
  }

  // Объединяем существующие данные с новыми данными
  const combinedData = existingData + newData;

  // Если общий объем данных превышает 5000 байт, обрезаем лишнее
  if (combinedData.length > config["Connections"]["maxCacheData"]) {
    const startIndex = combinedData.length - config["Connections"]["maxCacheData"];
    existingData = combinedData.slice(startIndex);
  } else {
    existingData = combinedData;
  }

  // Записываем данные обратно в файл
  fs.writeFileSync(CACHE_PATH, existingData);
}

function read_cache() {
  try {
    const fileContents = fs.readFileSync(CACHE_PATH, 'utf-8');
    return fileContents
  } catch (e) {
    return ""
  }

}

/*----------------------------------------------------------------------------*/

const light_thame = {
  background: '#ffffff',
  cursor: 'black',
  selection: '#d3d3d3',
  black: '#000000',
  red: '#ff0000',
  green: '#008000',
  yellow: '#ffd700',
  blue: '#0000ff',
  magenta: '#ff00ff',
  cyan: '#00ffff',
  white: '#ffffff',
  brightBlack: '#808080',
  brightRed: '#ff0000',
  brightGreen: '#008000',
  brightYellow: '#ffd700',
  brightBlue: '#0000ff',
  brightMagenta: '#ff00ff',
  brightCyan: '#00ffff',
  brightWhite: '#ffffff',
  foreground: "#000000"
}

var debounce_font_alert = undefined;

function close_font_alert() {
  closeModal("font_size");
}

function show_font_alert(size) {
  openModal("font_size");
  document.getElementById("font_size").innerHTML = `font-size: ${size}px`;
  debounce_font_alert = debounce(close_font_alert, 1000);
  debounce_font_alert();
}

const term = new Terminal({
  cursorBlink: true,
  macOptionIsMeta: true
});

if (config["Connections"]["cacheData"]) {
  term.write(read_cache());
  printOnNewLine(`[\x1b[34mINFO\x1b[0m] Restore cache data.`);
}

// переносит каретку если строка не пустая
function newLine() {
  const currentRow = term.buffer.active.getLine(term.buffer.cursorY);
  if (!currentRow?.isWrapped) {
    term.write('\r\n');
  }
}

// вывод линии в терминал (переносит каретку если строка не пустая)
function printOnNewLine(text) {
  newLine();
  term.write(text);
}

// разбор ошибки и вывод её в терминал
function assembly_error(err) {
  for (const key of Object.keys(err)) {
    console.log(key, err[key]);
  }

  switch (err.level) {
    case "client-socket":
      printOnNewLine(`[\x1b[31mERROR\x1b[0m] Failed to connect to the remote server. (${err.code})`);
      break;
    case "client-authentication":
      printOnNewLine(`[\x1b[31mERROR\x1b[0m] Invalid credentials for authentication.`);
      break;
    default:
      printOnNewLine(`[\x1b[31mERROR\x1b[0m] ${err.level}`);
      break;
  }
  console.log("----------------");
}

// установка темы выбранной в настройках
document.documentElement.setAttribute('data-theme', config.General.thame);
if (config.General.thame == 'light') {
  term.setOption('theme', light_thame);
}

let currentFontSize = term.getOption('fontSize');

term.attachCustomKeyEventHandler(customKeyEventHandler);

const fit = new FitAddon.FitAddon();
term.loadAddon(fit);
// term.loadAddon(new WebLinksAddon.WebLinksAddon());
term.loadAddon(new SearchAddon.SearchAddon());

term.open(document.getElementById("terminal"));
fit.fit();
term.resize(100, 50);
fit.fit();

/*----------------------------------------------------------------------------*/

var stream_obj = undefined;
var conn = undefined;
var connected_flag = false;
var first_connect = true;

/*----------------------------------------------------------------------------*/

// подгон размера терминала под окно
function fitToscreen() {
  fit.fit();
  console.log(stream_obj);
  if (stream_obj)
    stream_obj.setWindow(term.rows, term.cols);
}

// изменение размера шрифта при использовании CTRL + WHEEL
document.addEventListener('wheel', (event) => {
  if (event.ctrlKey) {
    const delta = event.deltaY > 0 ? -1 : 1;
    currentFontSize += delta;
    currentFontSize = Math.max(8, Math.min(24, currentFontSize));
    term.setOption('fontSize', currentFontSize);
    fitToscreen();
    show_font_alert(currentFontSize);
  }
});

// евент на подгон размера терминала под окно
window.onresize = debounce(fitToscreen, wait_ms);

/*----------------------------------------------------------------------------*/

function create_connection() {
  first_connect = false;
  update_status(group_id, item_id, 2);
  conn = new Client();
  try {
    conn.on('ready', () => {
      console.log('Client :: ready');
      newLine();
      conn.shell((err, stream) => {
        if (err) throw err;
        stream_obj = stream;
        stream.on('close', () => {
          console.log('Stream :: close');
          printOnNewLine(`[\x1b[34mINFO\x1b[0m] Remote host terminated an existing connection.`);
          update_status(group_id, item_id, 0);
          connected_flag = false;
          conn.end();
        }).on('data', (data) => {
          term.write(data);
          if (config["Connections"]["cacheData"])
            add_cache(data);
        });

        term.onData((data) => {
          stream.write(data);
        });

        try {
          fitToscreen();
        } catch (e) {}

        document.addEventListener("DOMContentLoaded", function() {
          fitToscreen();
        });

        connected_flag = true;
        update_status(group_id, item_id, 3);

        if (connection_config.first_command.length > 0) {
          stream.write(atob(connection_config.first_command) + "\n");
        }

      });
    }).on('error', function(err){
      assembly_error(err);
      update_status(group_id, item_id, 1);
      connected_flag = false;
    }).connect({
      host: connection_config.host,
      port: connection_config.port,
      username: connection_config.username,
      password: (!connection_config.auth_scheme || connection_config.auth_scheme == "lap")? connection_config.password: undefined,
      privateKey: (connection_config.auth_scheme == "lak")? readFileSync(connection_config.privateKey): undefined,
      readyTimeout: config.Connections.readyTimeout
    });
  } catch (e) {
    printOnNewLine(`[\x1b[31mERROR\x1b[0m] ${e}`);
    update_status(group_id, item_id, 1);
    connected_flag = false;
    console.error();(e);
  }

}

// переподключение
function reconnect() {
  if (conn) {
    conn.end();
    printOnNewLine("[\x1b[34mINFO\x1b[0m] RECONNECTING...");
  }

  setTimeout(() => {
    create_connection();
  }, 100);
}

// копирование вставка
function customKeyEventHandler(e) {
  if (e.type !== "keydown") {
    return true;
  }
  if (e.ctrlKey && e.shiftKey) {
    const key = e.key.toLowerCase();
    if (key === "v") {
      navigator.clipboard.readText().then((toPaste) => {
        term.writeText(toPaste);
      });
      return false;
    } else if (key === "c" || key === "x") {
      const toCopy = term.getSelection();
      navigator.clipboard.writeText(toCopy);
      term.focus();
      return false;
    }
  }
  return true;
}

// если нам надо сразу подключаться
if (config["Connections"]["autoConnect"]) {
  create_connection();
}
