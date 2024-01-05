const fs = require('fs');
const Store = require('electron-store');
const store = new Store();

function randomString(size) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: size }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

class Settings {
  constructor(path = 'settings.ini', options = null) {
    this.path = path;
    this.errorPrompt = 'SETTINGS: ';

    if (options) {
      this.options = options;
    } else {
      this.options = {
        "General": {
          "autoStart": false,
          "keepBackground": false,
          "thame": "dark" // light, dark, system
        },
        "Connections": {
          "autoConnect": true
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

    store.set('settings', config);
  }

  setSettings(section, parameter, state) {
    this.options[section][parameter] = state;
  }

  readSettings() {
    if (!store.has('settings')) {
      this.saveSettings();
      this.readSettings();
    } else {
      const config = store.get('settings');
      let errorBool = false;

      for (const section in this.options) {
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
