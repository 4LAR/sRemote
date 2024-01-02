const {app, nativeImage, Tray, Menu, BrowserWindow, ipcMain, systemPreferences} = require("electron");
const path = require('path');

const Settings_module = require('./settings');
const settings = new Settings_module();

let win;
let top = {};

const DEBUG = true;

try {
  require('electron-reloader')(module, {
    ignore: [
      "settings.ini",
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

  top.win.loadFile('index.html');
  top.win.removeMenu();

  if (settings.options["General"]["keepBackground"]) {
    top.win.on("close", ev => {
      top.win.hide();
      ev.preventDefault();
    });

    top.tray = new Tray(path.join(__dirname, 'logo.png'));
    const menu = Menu.buildFromTemplate([
      {label: "Show", click: (item, window, event) => {
        top.win.show();
      }},
      {type: "separator"},
      {role: "quit"},
    ]);
    top.tray.setToolTip("sRemote");
    top.tray.setContextMenu(menu);
  }

  if (DEBUG) {
    top.win.on("ready-to-show", () => {
      top.win.webContents.openDevTools();
    });
  }

  ipcMain.on('relaunch', () => {
    app.relaunch();
    app.quit();
  });

  ipcMain.on('get-config', () => {
    top.win.webContents.send('get-config-response', settings.options);
  });

  ipcMain.on('update-config', (event, response) => {
    settings.options = response;
    settings.saveSettings();
  });

}

app.whenReady().then(() => {
  createWindow();
})

if (!settings.options["General"]["keepBackground"]) {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
} else {
  app.on("before-quit", ev => {
    top.win.removeAllListeners("close");
    top = null;

    if (process.platform !== 'darwin') app.quit()
  });
}

app.on('closed', () => app.quit());

/*----------------------------------------------------------------------------*/
