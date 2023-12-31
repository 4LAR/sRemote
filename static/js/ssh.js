const { Client } = require('ssh2');

const wait_ms = 50;

const CONNECTIONS_FILE = "connections.json"
var config = JSON.parse(get_arg("data"));
var id = get_arg("id");

function assembly_error(err) {
  for (const key of Object.keys(err)) {
    console.log(key, err[key]);
  }
  console.log("----------------");
}

const term = new Terminal({
  cursorBlink: true,
  macOptionIsMeta: true,
  theme: {
    // foreground: '#d2d2d2',
    // background: '#282C34',
    // cursor: '#adadad',
    // black: '#000000',
    // red: '#d81e00',
    // green: '#5ea702',
    // yellow: '#cfae00',
    // blue: '#427ab3',
    // magenta: '#89658e',
    // cyan: '#00a7aa',
    // white: '#ABB2BF',
    // brightBlack: '#686a66',
    // brightRed: '#f54235'
  }
});

term.attachCustomKeyEventHandler(customKeyEventHandler);

const fit = new FitAddon.FitAddon();
term.loadAddon(fit);
// term.loadAddon(new WebLinksAddon.WebLinksAddon());
term.loadAddon(new SearchAddon.SearchAddon());

term.open(document.getElementById("terminal"));
fit.fit();
term.resize(15, 50);
fit.fit();

var conn = undefined;
var connected_flag = false;
function create_connection() {
  update_status(id, 2);
  conn = new Client();
  conn.on('ready', () => {
    console.log('Client :: ready');
    conn.shell((err, stream) => {
      if (err) throw err;
      stream.on('close', () => {
        console.log('Stream :: close');
        update_status(id, 0);
        connected_flag = false;
        conn.end();
      }).on('data', (data) => {
        term.write(data)
      });

      term.onData((data) => {
        stream.write(data);
      });

      fitToscreen();

      function fitToscreen() {
        fit.fit();
        stream.setWindow(term.rows, term.cols);
      }

      window.onresize = debounce(fitToscreen, wait_ms);

      document.addEventListener("DOMContentLoaded", function() {
        fitToscreen();
      });
      connected_flag = true;
      update_status(id, 3);
    });
  }).on('error', function(err){
    assembly_error(err);
    update_status(id, 1);
    connected_flag = false;
  }).connect({
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password
  });
}

function reconnect() {
  conn.end();

  term.writeln("");
  term.writeln("");
  term.writeln("");

  setTimeout(() => {
    create_connection();
  }, 100);
}

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

create_connection();
