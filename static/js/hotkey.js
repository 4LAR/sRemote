
class HotkeyStore {
  constructor(storeObj=undefined, key=this.key) {
    this.storeObj = storeObj;
    this.key = key;
    if (!this.storeObj.has(this.key)) {
      store.set(this.key, {
        "ctrl+shift+KeyB": "main:left_menu()",
    		"ctrl+shift+KeyI": "main:alert_settings()",
    		"ctrl+shift+KeyC": "connection:terminalCopy()",
    		"ctrl+shift+KeyV": "connection:terminalPaste()",
    		"alt+Digit1": "connection:openTabIndex(0)",
    		"alt+Digit2": "connection:openTabIndex(1)",
    		"alt+Digit3": "connection:openTabIndex(2)",
    		"alt+Digit4": "connection:openTabIndex(3)",
    		"alt+Digit5": "connection:openTabIndex(4)",
    		"alt+Digit6": "connection:openTabIndex(5)",
    		"alt+Digit7": "connection:openTabIndex(6)",
    		"alt+Digit8": "connection:openTabIndex(7)",
    		"alt+Digit9": "connection:openTabIndex(8)",
    		"alt+Digit0": "connection:openTabIndex(9)",
    		"ctrl+shift+KeyN": "connection:add_tab()",
    		"ctrl+shift+KeyW": "connection:closeCurrentTab()",
    		"ctrl+alt+ArrowLeft": "connection:openLeftTab()",
    		"ctrl+alt+ArrowRight": "connection:openRightTab()"
    	});
    }
  }

  _get_hotkey(keysStr) {
    const keysDict = this.storeObj.get(this.key);
    return keysDict[keysStr];
  }

  keydown(evt, parentEl=undefined) {
    if (!evt) evt = event;
    if (evt.type !== "keydown") return true;
    console.log(evt.ctrlKey, evt.altKey, evt.shiftKey, evt.code, parentEl);
    let strKeys = "";

    if (evt.ctrlKey) strKeys += "ctrl+";
    if (evt.altKey) strKeys += "alt+";
    if (evt.shiftKey) strKeys += "shift+";

    if (evt.code.indexOf("Key") != -1) strKeys += evt.code;
    if (evt.code.indexOf("Numpad") != -1) strKeys += evt.code;
    if (evt.code.indexOf("Digit") != -1) strKeys += evt.code;
    if (evt.code.indexOf("Arrow") != -1) strKeys += evt.code;
    if (evt.code[0] == "F") strKeys += evt.code;
    console.log(strKeys);
    const operation = this._get_hotkey(strKeys);
    if (!operation) return true;
    evt.preventDefault();
    evt.stopPropagation();
    const target = operation.split(":")[0];
    const func = operation.split(":")[1];

    if (target == "connection") {
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
