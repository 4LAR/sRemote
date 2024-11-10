
//
function search() {
  var search = document.getElementById("search").value.toLowerCase();
  //
  if (search.length < 1) {
    for (const group of TABS) {
      openModal(`group_${group.id}`);
      for (const item of group.items) {
        openModal(`item_${group.id}_${item.id}`);
        openModal(`line_${group.id}_${item.id}`);
      }
      auto_height_items(group.id);
    }
    closeModal("toolBar_info");
    return;
  }

  let count_found = 0;
  for (const group of TABS) {
    var found_flag = false;
    for (const item of group.items) {
      var search_item = item.search.toLowerCase();
      if (search_item.indexOf(search) > -1) {
        console.log(search_item);
        count_found++;
        found_flag = true;
        openModal(`item_${group.id}_${item.id}`);
        openModal(`line_${group.id}_${item.id}`);
      } else {
        closeModal(`item_${group.id}_${item.id}`);
        closeModal(`line_${group.id}_${item.id}`);
      }
    }
    if (found_flag) {
      openModal(`group_${group.id}`);
      auto_height_items(group.id);
    } else {
      closeModal(`group_${group.id}`);
    }
  }
  if (count_found < 1) {
    openModal("toolBar_info");
    document.getElementById("toolBar_info").innerHTML = localization_dict.no_connections_found;
  } else {
    closeModal("toolBar_info");
  }
}

document.getElementById("search").onkeyup = debounce(search, 250);
