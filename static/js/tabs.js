
const CONNECTIONS_FILE = "connections.json"
var TABS = [];
var SELECTED = 0;
function select_tab(id) {
  var i = 0;
  for (const el of TABS) {
    if (el.id == id) {
      SELECTED = i
      document.getElementById(el.id + "_menu").className = "selected";
      openModal(el.id + "_body");
    } else {
      document.getElementById(el.id + "_menu").className = "";
      closeModal(el.id + "_body");
    }
    i++;
  }
}

function append_tab(name, id="", selected=false) {
  append_to_ul("tabs", `
    <p>${name}</p>
    <div>
      <img src="./static/img/cross.svg">
    </div>
  `, function() {
    select_tab(id);
  }, id + "_menu", className=(selected)? "selected": "");
  append_to_ul("terminal_list", `<iframe src="ssh.html" style="display: none" id="${id + "_body"}"></div>`);
  // var iframe = document.getElementById(id + "_body");
  // iframe.onload = function () {
  //   const iframeWin = iframe.contentWindow
  //   iframeWin.require = window.require
  // }
}

function read() {
  var config_file = JSON.parse(JSON.stringify(require(`./${CONNECTIONS_FILE}`)));

  let i = 0;
  for (const el of config_file["connections"]) {
    try {
      TABS.push({
        "id": `${++i}`
      });
      append_tab(el.name, TABS[TABS.length - 1].id);

    } catch (e) {
      console.warn(e);
    }
  }
  console.log(TABS[0].id);
  select_tab(TABS[0].id);
}

read();

// document.getElementById("tabs").addEventListener("wheel", function (e) {
//   console.log(e);
//   document.getElementById("tabs").scrollLeft += (e.deltaY || e.detail || e.wheelDelta);
// });
