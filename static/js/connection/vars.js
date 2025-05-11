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

/*----------------------------------------------------------------------------*/

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

/*----------------------------------------------------------------------------*/

// if (config["Connections"]["cacheData"]) {
//   term.write(read_cache());
//   printOnNewLine(`[\x1b[34mINFO\x1b[0m] Restore cache data.`);
// }

/*----------------------------------------------------------------------------*/
