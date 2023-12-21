
function append_tab(name, selected=false) {
  append_to_ul("tabs", `
    <p>${name}</p>
    <div class="kal">
      <img src="./static/img/cross.svg">
    </div>
  `, undefined, className=(selected)? "selected": "")
}

append_tab("ubuntu");
append_tab("ubuntu-server", true);
append_tab("ubuntu");
append_tab("ubuntu");
append_tab("ubuntu");
append_tab("ubuntu");

// document.getElementById("tabs").addEventListener("wheel", function (e) {
//   console.log(e);
//   document.getElementById("tabs").scrollLeft += (e.deltaY || e.detail || e.wheelDelta);
// });
