const crypto = require('crypto');

// Хранилище для настроек, соединений и тп
const Store = require('electron-store');
const store = new Store();

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

encrT = textEncrypt("60798", "HELLO WORLD");
console.log(encrT);
console.log(textDecrypt("60798", encrT.data, encrT.hash));
console.log(textDecrypt("123213", encrT.data, encrT.hash));

class ConnectionsStore {
  constructor(storeObj=undefined, key='connections') {
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
