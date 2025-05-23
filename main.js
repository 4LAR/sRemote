const {app, nativeImage, Tray, Menu, BrowserWindow, ipcMain, systemPreferences, dialog} = require("electron");
const fs = require('fs');
const os = require('os');
const AutoLaunch = require('auto-launch');
const path = require('path');
const isPackaged = require('electron-is-packaged').isPackaged;
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');
const minimist = require('minimist');

Store.initRenderer();

const args = minimist(process.argv.slice(isPackaged ? 1 : 2));
console.log(args);

const gotTheLock = app.requestSingleInstanceLock();

var APP_PATH = undefined;
if (process.env.PORTABLE_EXECUTABLE_DIR !== undefined) {
  APP_PATH = process.env.PORTABLE_EXECUTABLE_DIR + "/" + app.getName() + ".exe";
} else {
  APP_PATH = app.getPath('exe');
}

console.log("APP_PATH", APP_PATH);

const Settings_module = require('./settings');
const settings = new Settings_module(args.config || 'config');

let win;
let top = {};

/*----------------------------------------------------------------------------*/

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

/*----------------------------------------------------------------------------*/

ipcMain.on('save-connection-dialog', (event, response) => {
  dialog.showSaveDialog({
    title: 'Save Connection',
    defaultPath: `${response.name}.srem`,
    filters: [
      { name: 'Connection File', extensions: ['srem'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled) {
      const filePath = result.filePath;
      console.log('Selected file:', filePath);

      const dataToSave = JSON.stringify(response.data);
      fs.writeFile(filePath, dataToSave, (err) => {
        if (err) {
          console.error('Error saving file:', err);
        } else {
          console.log('File saved successfully.');
        }
      });
    }
  }).catch(err => {
    console.error(err);
  });
});

ipcMain.on('save-files-folder-dialog', (event, response) => {
  const result = dialog.showOpenDialog({
    title: response.title,
    properties: ['openDirectory']
  }).then(result => {
    if (result.canceled)
      return;
    top.win.webContents.send('save-files-folder-dialog-command', {
      target: response.target,
      id: response.id,
      function: response.function,
      result: result.filePaths[0]
    });
  });
});

/*----------------------------------------------------------------------------*/

try {
  require('electron-reloader')(module, {
    ignore: [
      "settings.ini",
      "connections.json"
    ]
  })
} catch {}

/*----------------------------------------------------------------------------*/
const createWindow = () => {
  const mainWindowState = windowStateKeeper({
   defaultWidth: 1000,
   defaultHeight: 600,
 });

  top.win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    x: (settings.options["General"]["saveWindowState"])? mainWindowState.x: undefined,
    y: (settings.options["General"]["saveWindowState"])? mainWindowState.y: undefined,
    width: ((settings.options["General"]["saveWindowState"])? mainWindowState.width: 1000),
    minWidth: 1000,
    height: ((settings.options["General"]["saveWindowState"])? mainWindowState.height: 600),
    minHeight: 600,
    frame: (os.platform() !== "win32") || (settings.options["General"]["defaultTitleBar"]),
    icon: path.join(__dirname, 'logo.ico'),
    resizable: true
  })

  top.win.loadFile('index.html', {
    query: { args: JSON.stringify(args) }
  });
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
    top.tray.on('click', () => {
      top.win.show();
    });
  }

  if (settings.options["General"]["devTools"]) {
    top.win.on("ready-to-show", () => {
      top.win.webContents.openDevTools();
    });
  }
  if (settings.options["General"]["saveWindowState"]) {
    mainWindowState.manage(top.win);
  }

  // Если пытаемся запустить второй экземпляр, фокусируем основное окно
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (top.win) {
      if (process.platform === 'win32') {
        const filePath = commandLine.slice(1)[1];
        if (filePath) {
          top.win.webContents.send('file-open', filePath);
        }
      }
      top.win.show()
      if (top.win.isMinimized())
        top.win.restore();
      top.win.focus();
    }
  });

  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    top.win.webContents.send('file-open', filePath);
  });

  // перезапуск приложения
  ipcMain.on('relaunch', () => {
    if (isPackaged) {
      app.relaunch({ execPath: process.env.PORTABLE_EXECUTABLE_FILE });
    } else {
      app.relaunch();
    }
    app.quit();
  });

  // получить конфиг
  ipcMain.on('get-config', () => {
    top.win.webContents.send('get-config-response', settings.options);
  });

  // обновить конфиг и сохранить в файл
  ipcMain.on('update-config', (event, response) => {
    settings.options = response;
    settings.saveSettings();
  });

  function parse_menu_template(event, response, data, subret="") {
    var result = [];
    for (const el of data) {
      var insert_data = {};
      if ("type" in el) {
        insert_data = el;
      } else {
        insert_data = {
          label: el.label,
          enabled: el.enabled,
          accelerator: el.accelerator
        }
        if (!("submenu" in el)) {
          insert_data.click = () => {
            event.sender.send('context-menu-command', {
              target: response.target,
              id: response.id,
              arg: response.arg,
              function: response.function,
              action: `${subret}${el.label}`
            })
          }
        } else {
          insert_data.submenu = parse_menu_template(event, response, el.submenu, `${subret}${el.label}_`);
        }
      }
      result.push(insert_data);
    }
    return result;
  }

  ipcMain.on('show-context-menu', (event, response) => {
    const template = parse_menu_template(event, response, response.template);
    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
  })

  // Обработчик для скрытия окна
  ipcMain.on('hide-window', () => {
    top.win.minimize();
  });

  // Обработчик для максимизации окна
  ipcMain.on('maximize-minimize-window', () => {
    if (top.win.isMaximized()) {
      top.win.unmaximize();
    } else {
      top.win.maximize();
    }
  });

  // Обработчик для закрытия окна
  ipcMain.on('close-window', () => {
    top.win.close();
  });

  top.win.on('maximize', () => {
    top.win.webContents.send('maximize', true);
  })

  top.win.on('unmaximize', () => {
    top.win.webContents.send('maximize', false);
  })
}

if (!gotTheLock) {
  console.log("The application is already running.");
  app.quit();
} else {
  app.whenReady().then(() => {
    createWindow();
  })
}

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
