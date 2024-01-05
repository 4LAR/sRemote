const {app, nativeImage, Tray, Menu, BrowserWindow, ipcMain, systemPreferences} = require("electron");
const AutoLaunch = require('auto-launch');
const path = require('path');
const isPackaged = require('electron-is-packaged').isPackaged;
const Store = require('electron-store');
Store.initRenderer();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log("The application is already running.");
  app.quit();
}

var APP_PATH = undefined;
if (process.env.PORTABLE_EXECUTABLE_DIR !== undefined) {
  APP_PATH = process.env.PORTABLE_EXECUTABLE_DIR + "/" + app.getName() + ".exe";
} else {
  APP_PATH = app.getPath('exe');
}

console.log("APP_PATH", APP_PATH);
// console.log("STORE_PATH", store.path);

const Settings_module = require('./settings');

const settings = new Settings_module("./settings.ini");

let win;
let top = {};

const DEBUG = false;

const appLauncher = new AutoLaunch({
  name: 'sRemote',
  path: APP_PATH
});

appLauncher.isEnabled().then((isEnabled) => {
  console.log("AutoStart:", isEnabled);
  if (settings.options["General"]["autoStart"]) {
    if (!isEnabled) {
      appLauncher.enable();
      console.log("AutoStart enabled");
    }
  } else {
    if (isEnabled) {
      appLauncher.disable();
      console.log("AutoStart disabled");
    }
  }
});

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
    if (isPackaged) {
      app.relaunch({ execPath: process.env.PORTABLE_EXECUTABLE_FILE });
    } else {
      app.relaunch();
    }
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
