document.getElementById("menu_terminal_button_text").innerHTML = localization_dict.ssh_menu_terminal;
// document.getElementById("menu_files_button_text").innerHTML = localization_dict.ssh_menu_files;

// document.getElementById("connection_warning_text").innerHTML = localization_dict.sftp_connection_warning;
// document.getElementById("files_0_text").innerHTML = localization_dict.sftp_drop;
// document.getElementById("files_1_text").innerHTML = localization_dict.sftp_drop;

const menu_items = [
  "terminal",
  // "files"
]
let first_run = true;
var current_menu = "";
function open_menu(item) {
  for (const menu_el of menu_items) {
    if (menu_el == item) {
      document.getElementById(`menu_${menu_el}_button`).className = "selected";
      document.getElementById(`menu_${menu_el}`).style.display = "block";
    } else {
      document.getElementById(`menu_${menu_el}_button`).className = "";
      document.getElementById(`menu_${menu_el}`).style.display = "none";
    }
  }
  current_menu = item;
  switch (item) {
    case "terminal":
      if (!first_run) {
        fitToscreen();
        focusOnTerminal();
      }
      break;
    default:
      break;
  }
  first_run = false;
}

open_menu("terminal");


/*----------------------------------------------------------------------------*/

var debounce_font_alert = debounce(close_font_alert, 500);
function show_font_alert(size) {
  openModal("font_size");
  document.getElementById("font_size").innerHTML = `font-size: ${size}px`;
  debounce_font_alert();
}

/*----------------------------------------------------------------------------*/

const tabs_list = document.getElementById('tabs_list');
const terminal_list = document.getElementById('terminal_list');

function add_tab() {
  let index = shellManager.add_shell();
}

function open_tab(id) {
  const index = shellManager._get_index_by_id(id);
  if (index < 0) return;
  shellManager.current_shell = id;
  for (const tab of tabs_list.getElementsByClassName('container')[0].getElementsByTagName('DIV')) {
    if (Number(tab.id.split("_")[1]) == id) {
      tab.className = "selected"
    } else {
      tab.className = ""
    }
  }

  for (const term of terminal_list.childNodes) {
    if (Number(term.id.split("_")[1]) == id) {
      // fit.fit();
      term.classList.add("selected");
    } else {
      term.classList.remove("selected");
    }
  }
  shellManager.fit(id);
  shellManager.focus(id);
}

function openTabIndex(index) {
  if (index >= shellManager.shells.length) return;
  open_tab(shellManager.shells[index].id);
}

function openLeftTab() {
  const index = shellManager._get_index_by_id(shellManager.current_shell);
  if (index <= 0) return;
  open_tab(shellManager.shells[index - 1].id);
}

function openRightTab() {
  const index = shellManager._get_index_by_id(shellManager.current_shell);
  if (index >= shellManager.shells.length - 1) return;
  open_tab(shellManager.shells[index + 1].id);
}

function closeCurrentTab() {
  shellManager.close_tab(shellManager.current_shell);
}

shellManager.add_shell(name="main", auto_connect=false);

// function transformScroll(event) {
//   console.log(event.currentTarget.scrollLeft);
//   console.log(event.deltaY, event.deltaX);
//   if (!event.deltaY) {
//     return;
//   }
//   event.currentTarget.scrollLeft += (event.deltaY + event.deltaX) / 4;
//   event.preventDefault();
// }
//
// tabs_list.addEventListener('wheel', transformScroll);

const sortable_groups = new Sortable(tabs_list.getElementsByClassName('container')[0], {
  group: 'groups',
  animation: 150,
  ghostClass: 'sortable-ghost',
  onStart: function (evt) {
    evt.item.style.opacity = '0.4';
  },
  onMove: function(evt) {

  },
  onEnd: function (evt) {
    evt.item.style.opacity = '1';

  }
});
