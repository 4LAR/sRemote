

function share(group_id, item_id=undefined) {
  const config_file = store.get('connections');
  var save_data = {};
  var name = "";
  if (item_id) {
    var index = get_indexes_by_id(group_id, item_id);
    name = config_file[index[0]].items[index[1]].name;
    save_data = {
      "type": "connection",
      "data": config_file[index[0]].items[index[1]]
    };
  } else {
    var index = get_index_group_by_id(group_id);
    name = config_file[index].name;
    save_data = {
      "type": "group",
      "data": config_file[index]
    };
  }

  ipcRenderer.send('save-connection-dialog', {
    name: name,
    data: save_data
  });
}

/*----------------------------------------------------------------------------*/

function import_connection(file_path) {
  console.log(file_path);
}

/*----------------------------------------------------------------------------*/

ipcRenderer.on('file-open', (event, file) => {
  import_connection(file);
});

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.body;

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = event.dataTransfer.files;

    if (files.length > 0) {
      const filePath = files[0].path;
      import_connection(filePath);
    }
  });
});
