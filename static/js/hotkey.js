
class HotkeyStore {
  constructor(storeObj=undefined, key=this.key) {
    this.storeObj = storeObj;
    this.key = key;
    if (!this.storeObj.has(this.key)) {
      store.set(this.key, {
    		"ctrl+shift+KeyB": "main:left_menu()",
    		"ctrl+shift+KeyC": "ssh:terminalCopy()",
    		"ctrl+shift+KeyV": "ssh:terminalPaste()",
    		"alt+Digit1": "ssh:openTabIndex(0)",
    		"alt+Digit2": "ssh:openTabIndex(1)",
    		"alt+Digit3": "ssh:openTabIndex(2)",
    		"alt+Digit4": "ssh:openTabIndex(3)",
    		"alt+Digit5": "ssh:openTabIndex(4)",
    		"alt+Digit6": "ssh:openTabIndex(5)",
    		"alt+Digit7": "ssh:openTabIndex(6)",
    		"alt+Digit8": "ssh:openTabIndex(7)",
    		"alt+Digit9": "ssh:openTabIndex(8)",
    		"alt+Digit0": "ssh:openTabIndex(9)"
    	});
    }
  }

  _get_hotkey(keysStr) {
    const keysDict = this.storeObj.get(this.key);
    return keysDict[keysStr];
  }

  keydown(evt, parentEl=undefined) {
    if (!evt) evt = event;
    // console.log(evt.ctrlKey, evt.altKey, evt.shiftKey, evt.code, parentEl);
    let strKeys = "";

    if (evt.ctrlKey) strKeys += "ctrl+";
    if (evt.altKey) strKeys += "alt+";
    if (evt.shiftKey) strKeys += "shift+";

    if (evt.code.indexOf("Key") != -1) strKeys += evt.code;
    if (evt.code.indexOf("Numpad") != -1) strKeys += evt.code;
    if (evt.code.indexOf("Digit") != -1) strKeys += evt.code;
    if (evt.code[0] == "F") strKeys += evt.code;

    const operation = this._get_hotkey(strKeys);
    if (!operation) return true;
    evt.preventDefault();
    const target = operation.split(":")[0];
    const func = operation.split(":")[1];

    if (target == "ssh") {
      if (parentEl)
        eval(`document.getElementById("${parentEl.id}").contentWindow.${func}`);
    } else if (target == "main") {
      eval(`${func}`);
    }
    return false;
  }
}

hotkeyStore = new HotkeyStore(store, 'hotkeys');

window.addEventListener('keydown', (e) => hotkeyStore.keydown(e));

// document.onkeydown = keydown;
//
// // обработка горячих клавиш
// function customKeyEventHandler(e) {
//   if (e.type !== "keydown") {
//     return true;
//   }
//   if (e.ctrlKey && e.shiftKey) {
//     const code = e.code;
//     if (code === "KeyB") {
//       left_menu();
//       return false;
//     }
//   }
//   return true;
// }
//
// window.addEventListener('keydown', customKeyEventHandler);
