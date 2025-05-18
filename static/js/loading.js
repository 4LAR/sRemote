
// Хранилище для настроек, соединений и тп
const Store = require('electron-store');
const store = new Store({
  name: args.config || 'config'
});

var tabs_loaded_flag = false;
var dom_loaded_flag = false;

document.addEventListener("DOMContentLoaded", function() {
  dom_loaded_flag = true;
  close_loading();
});

function close_loading() {
  if (dom_loaded_flag && tabs_loaded_flag) {
    document.getElementById("main_loading").className = "main_loading loaded";
  }
}
