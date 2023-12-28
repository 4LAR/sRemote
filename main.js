const {app, nativeImage, Tray, Menu, BrowserWindow, ipcMain} = require("electron");
const path = require('path');

let win;
let top = {};

const DEBUG = true;

try {
  require('electron-reloader')(module, {
    ignore: [
      "config.json",
      "connections.json"
    ]
  })
} catch {}

const createWindow = () => {
  top.win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    width: (DEBUG)? 1250: 1000,
    minWidth:(DEBUG)? 1250: 1000,
    height: 600,
    minHeight: 600,
    icon: path.join(__dirname, 'logo.ico'),
    resizable: true
  })

  top.win.loadFile('index.html')
  top.win.removeMenu()

  top.win.on("close", ev => {
    top.win.hide();
    ev.preventDefault();
  });

  if (DEBUG) {
    top.win.on("ready-to-show", () => {
      top.win.webContents.openDevTools();
    });
  }

  top.tray = new Tray(path.join(__dirname, 'logo.png'));
  const menu = Menu.buildFromTemplate([
    {label: "Show", click: (item, window, event) => {
      top.win.show();
    }},
    {type: "separator"},
    {role: "quit"},
  ]);
  top.tray.setToolTip("Discrod RPC");
  top.tray.setContextMenu(menu);
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('closed', () => app.quit());

/*----------------------------------------------------------------------------*/
