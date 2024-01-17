
//
function search() {
  var search = document.getElementById("search").value.toLowerCase();
  //
  if (search.length < 1) {

    return;
  }
}

document.getElementById("search").onkeyup = debounce(search, 250);
