window.require = parent.window.require
const { Client } = require('ssh2');

const CONNECTIONS_FILE = "connections.json"
var config_file = JSON.parse(JSON.stringify(require(`./${CONNECTIONS_FILE}`)));

const conn = new Client();

const term = new Terminal({
  cursorBlink: true,
  macOptionIsMeta: true,
  scrollback: true,
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

const fit = new FitAddon.FitAddon();
term.loadAddon(fit);
term.loadAddon(new WebLinksAddon.WebLinksAddon());
term.loadAddon(new SearchAddon.SearchAddon());

term.open(document.getElementById("terminal"));
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

    function fitToscreen() {
      fit.fit();
      stream.setWindow(term.rows, term.cols);
    }

    const wait_ms = 50;
    window.onresize = debounce(fitToscreen, wait_ms);
  });
}).connect({
  host: '192.168.1.119',
  port: 22,
  username: 'stolar',
  password: '4040'
});
