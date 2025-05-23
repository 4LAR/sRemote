const crypto = require('crypto');

function textEncrypt(password, text) {
  const algorithm = 'aes-256-ctr';
  const key = Buffer.concat([Buffer.from(password), Buffer.alloc(32)], 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    data: iv.toString('hex') + encrypted.toString('hex'),
    hash: crypto.createHash("sha256").update(text).copy().digest('hex')
  };
}

function textDecrypt(password, text, hash=undefined) {
  const algorithm = 'aes-256-ctr';
  const key = Buffer.concat([Buffer.from(password), Buffer.alloc(32)], 32);
  const iv = Buffer.from(text.substring(0, 32), 'hex');
  const encryptedText = Buffer.from(text.substring(32), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  const result = decrypted.toString();
  if (hash && hash !== crypto.createHash("sha256").update(result).copy().digest('hex')) {
    throw "Password is incorrect";
  }
  return result;
}

// encrT = textEncrypt("60798", "HELLO WORLD");
// console.log(encrT);
// console.log(textDecrypt("60798", encrT.data, encrT.hash));
// console.log(textDecrypt("123213", encrT.data, encrT.hash));

class ConnectionsStore {
  isEncrypted = false;
  _password = undefined;
  constructor(storeObj=undefined, key=this.key) {
    this.storeObj = storeObj;
    this.key = key;
    if (!this.storeObj.has(this.key)) {
      store.set(this.key, []);
    }
    this.isEncrypted = !Array.isArray(this.storeObj.get(this.key));

  }

  get() {
    if (!this.isEncrypted)
      return this.storeObj.get(this.key)

    if (this.isEncrypted && !this._password)
      throw "Data is encrypted";

    return JSON.parse(textDecrypt(
      this._password,
      this.storeObj.get(this.key).data,
      this.storeObj.get(this.key).hash
    ));
  }

  set(data) {
    if (!this.isEncrypted) {
      store.set(this.key, data);
      return;
    }

    const encrypted_data = textEncrypt(this._password, JSON.stringify(data));
    store.set(this.key, encrypted_data);
  }

  decrypt(password) {
    try {
      textDecrypt(
        password,
        this.storeObj.get(this.key).data,
        this.storeObj.get(this.key).hash
      )
      this._password = password;
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }
}

connectionsStore = new ConnectionsStore(store, 'connections');
console.log("isEncrypted:", connectionsStore.isEncrypted);

function enter_main_password() {
  if (connectionsStore.decrypt(document.getElementById('main_password').value)) {
    document.getElementById('main_password_block').style.display = "none";
    read();
  }
}

// connectionsStore.decrypt("4040")

// try {
//   console.log(connectionsStore.get());
// } catch (e) {
//   console.log(e);
// }
//
// console.log(connectionsStore.decrypt("1234"));
// try {
//   console.log(connectionsStore.get());
// } catch (e) {
//   console.log(e);
// }
//
// console.log(connectionsStore.decrypt("4040"));
// try {
//   console.log(connectionsStore.get());
// } catch (e) {
//   console.log(e);
// }
// console.log(connectionsStore.set([1, 2, 3, 4]));
