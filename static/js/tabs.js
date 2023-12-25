
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

function append_tab(data, id="", selected=false) {
  console.log(data);
  append_to_ul("tabs", `
    <p class="name">${data.name}</p>
    <p class="host">${data.host}:${data.port}</p>
    <div>
      <img src="./static/img/cross.svg">
    </div>
  `, function() {
    select_tab(id);
  }, id + "_menu", className=(selected)? "selected": "");
  append_to_ul("tabs", ``, undefined, "", "line");
  append_to_ul("terminal_list", `<iframe src='ssh.html?data=${JSON.stringify(data)}&id=${id}' style="display: none" id="${id + "_body"}"></div>`);
}

function read() {
  var config_file = JSON.parse(JSON.stringify(require(`./${CONNECTIONS_FILE}`)));

  let i = 0;
  for (const el of config_file["connections"]) {
    try {
      TABS.push({
        "id": `${++i}`
      });
      append_tab(el, TABS[TABS.length - 1].id);

    } catch (e) {
      console.warn(e);
    }
  }
  select_tab(TABS[0].id);
}

read();

// document.getElementById("tabs").addEventListener("wheel", function (e) {
//   console.log(e);
//   document.getElementById("tabs").scrollLeft += (e.deltaY || e.detail || e.wheelDelta);
// });
