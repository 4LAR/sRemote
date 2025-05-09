const fs = require('fs');
const Store = require('electron-store');

function randomString(size) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: size }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

class Settings {
  constructor(name='config', options=null) {
    this.name = name;
    this.errorPrompt = 'SETTINGS: ';
    this.store = new Store({
      name: this.name
    });
    console.log("Config name:", this.name);
    console.log(this.store.get('settings'));

    if (options) {
      this.options = options;
    } else {
      this.options = {
        "General": {
          "lang": "en",
          "autoStart": false,
          "keepBackground": false,
          "thame": "dark", // light, dark, system
          "saveWindowState": true,
          "defaultTitleBar": false,
          "experimental": false,
          "devTools": false
        },
        "Connections": {
          "autoConnect": false,
          "readyTimeout": 20000,
          "cacheData": false,
          "maxCacheData": 5000,
          "keepaliveCountMax": 3,
          "keepaliveInterval": 0
        },
        "Account": {
          "url": "https://sRemote.100lar-web.ru/",
          "token": "",
          "autofetch": true
        }
      };
    }

    this.readSettings();
  }

  saveSettings() {
    const config = {};

    for (const section in this.options) {
      config[section] = {};

      for (const parameter in this.options[section]) {
        config[section][parameter] = this.options[section][parameter];
      }
    }

    this.store.set('settings', config);
  }

  setSettings(section, parameter, state) {
    this.options[section][parameter] = state;
  }

  readSettings() {
    if (!this.store.has('settings')) {
      this.saveSettings();
      this.readSettings();
    } else {
      const config = this.store.get('settings');
      let errorBool = false;

      for (const section in this.options) {
        if (config[section] === undefined) {
          errorBool = true;
          continue;
        }
        for (const parameter in this.options[section]) {
          const parameterBuf = config[section][parameter];
          if (parameterBuf !== undefined) {
            this.setSettings(section, parameter, parameterBuf);
          } else {
            errorBool = true;
          }
        }
      }

      if (errorBool) {
        this.saveSettings();
      }
    }
  }
}

// const settings = new Settings();
module.exports = Settings
