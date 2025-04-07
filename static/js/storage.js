const crypto = require('crypto');

// Хрангилище для настроек, соединений и тп
const Store = require('electron-store');
const store = new Store();

class ConnectionsStore {
  constructor(storeObj=undefined) {
    this.storeObj = storeObj;
  }

  get() {

  }

  set() {

  }

  isEncrypted() {

  }

  decrypt() {

  }
}
