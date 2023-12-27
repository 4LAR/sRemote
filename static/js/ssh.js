const { Client } = require('ssh2');

const CONNECTIONS_FILE = "connections.json"
var config = JSON.parse(get_arg("data"));
var id = get_arg("id");
const conn = new Client();

update_status(id, 2);

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
term.loadAddon(new WebLinksAddon.WebLinksAddon());
term.loadAddon(new SearchAddon.SearchAddon());

term.open(document.getElementById("terminal"));
fit.fit();
term.resize(15, 50);
fit.fit();

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.shell((err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Stream :: close');
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

    const wait_ms = 50;
    window.onresize = debounce(fitToscreen, wait_ms);

    document.addEventListener("DOMContentLoaded", function() {
      fitToscreen();
    });
    update_status(id, 3);
  });
}).on('error', function(err){
  update_status(id, 1);
}).connect({
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password
});

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
