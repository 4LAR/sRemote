
var onclose_alert_function = undefined;
function open_alert(html, type="alert_sftp", onclose=undefined) {
  document.getElementById("files_alert_body").innerHTML = html;
  document.getElementById("files_alert").className = type;

  onclose_alert_function = onclose;

  openModal('files_bg_alert');
  openModal('files_alert');
}

function close_alert(onclose=true) {
  closeModal('files_bg_alert');
  closeModal('files_alert');

  if (onclose_alert_function && onclose) {
    onclose_alert_function();
  }
}

close_alert();

document.addEventListener('keydown', function(event){
  if (event.keyCode == 27) {
    close_alert();
  }
});

////////////////////////////////////////////////////////////////////////////////

function isValidLinuxFileName(fileName) {
    // Проверяем, что имя не пустое и не содержит недопустимых символов
    const invalidChars = /[\/\0]/; // недопустимые символы: / и null
    const isValid = !invalidChars.test(fileName) && fileName.length > 0;

    // Проверяем, что имя не начинается и не заканчивается пробелами
    const trimmedFileName = fileName.trim();
    const hasLeadingOrTrailingSpaces = (fileName !== trimmedFileName);

    // Проверяем, что имя не состоит только из пробелов
    const isOnlySpaces = trimmedFileName.length === 0;

    return isValid && !hasLeadingOrTrailingSpaces && !isOnlySpaces;
}

////////////////////////////////////////////////////////////////////////////////

function alert_error(text) {
  open_alert(`
    <p class="name">Error</p>
    <hr>
    <p>${text}</p>
    <div class="button submit" onclick="close_alert()">
      <p>Ok</p>
    </div>
  `, 'alert_sftp_file')
}

function alert_rename() {

}

function alert_new_folder() {
  open_alert(`
    <p class="name">Create folder</p>
    <hr>
    <input id="name" class="input_style" type="text" placeholder="Folder name">
    <div class="button submit" onclick="create_directory_from_alert()">
      <p>Create</p>
    </div>
  `, 'alert_sftp_file')
  document.getElementById("name").focus()
}

// alert_new_folder_file();

////////////////////////////////////////////////////////////////////////////////

var pathArr = [[], []];
var sftp_obj = undefined;
var selected_file = undefined;
var selected_li_file = undefined;
var split_flag = false;
var selected_files = [[], []];
var clipboard = {
  path: "",
  files: [],
  action: null
};

////////////////////////////////////////////////////////////////////////////////

function split() {
  split_flag = !split_flag;
  if (split_flag) {
    document.getElementById("files_div_0").style.width = "50%";
    document.getElementById("files_div_1").style.width = "50%";
    if (pathArr[1].length < 1) {
      pathArr[1] = pathArr[0].map((element) => element);
      listFiles(1);
    }
  } else {
    document.getElementById("files_div_0").style.width = "100%";
    document.getElementById("files_div_1").style.width = "0%";
  }
}

////////////////////////////////////////////////////////////////////////////////

function getHomePath() {
  return new Promise((resolve, reject) => {
    sftp_obj.realpath('.', (err, path) => {
      if (err) {
        return reject(err);
      }
      resolve(path);
    });
  });
}

function convert_path(arr) {
  return "/" + arr.join("/");
}

function listFiles(id=0) {
  clearFileList(id);
  selected_files[id] = [];
  var files = [];
  sftp_obj.readdir(convert_path(pathArr[id]), (err, list) => {
    if (err) {
      pathArr[id] = [];
      listFiles(id);
      return;
    }
    document.getElementById(`path_${id}`).value = convert_path(pathArr[id]);
    if (pathArr.length > 0)
      addBackButton(id);
    for (const file of list) {
      const name_splitted = file.longname.split(/\s+/);

      var file_type = "file";
      if (file.longname[0] == "d") {
        file_type = "folder";
      } else if (file.longname[0] == "l") {
        file_type = "link";
      }

      files.push({
        name: file.filename,
        type: file_type,
        access_rights: name_splitted[0],
        owner: name_splitted[2],
        group: name_splitted[3],
        size: Number(name_splitted[4])
      });

      files.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        if (a.type === 'link' && b.type !== 'link') return 1;
        if (a.type !== 'link' && b.type === 'link') return -1;
        return 0;
      });
    }
    for (const file of files) {
      appendFileList(file, id);
    }
  });
}

function clearFileList(id=0) {
  document.getElementById(`files_${id}`).innerHTML = "";
}

function clearSelectionEvent(event, id) {
  if (event.target.tagName == "UL")
    clearSelection(id);
}

function clearSelection(id) {
  const ul = document.getElementById(`files_${id}`);
  selected_files[id] = [];
  for (let li of ul.children) {
    li.classList.remove('selected');
  }
}

// access_rights:"lrwxrwxrwx"
// group:"root"
// name:"sbin"
// owner:"root"
// size:"8"
// type:"link"
function appendFileList(file, id=0) {
  var ul = document.getElementById(`files_${id}`);
  var li = document.createElement("li");
  const file_size = (file.type=="folder")? "": convert_size(file.size);
  li.innerHTML = `
    <img src="./static/img/files/${file.type}.svg" class="${file.type}">
    <p>${file.name}</p>
    <p class="size">${file_size}</p>
    <p class="access_rights">${file.access_rights}</p>
  `;
  li.onclick = function(event) {
    var element = event.target;
    if (element.tagName != "LI") {
      element = element.parentElement;
    }
    if (event.ctrlKey) {
      const index = selected_files[id].indexOf(file.name);
      if (index < 0) {
        selected_files[id].push(file.name);
        element.classList.add('selected');
      } else {
        selected_files[id].splice(index, 1);
        element.classList.remove('selected');
      }
    } else if (event.shiftKey) {
      clearSelection(Math.abs(id - 1))
      const lastSelected = selected_files[id].pop()
      selected_files[id] = [];
      const files_list = document.getElementById(`files_${id}`).getElementsByTagName("li");
      var indexLastSelected = -1;
      var indexSelected = -1;
      var index = -1;
      for (const el of files_list) {
        index++;
        if (el.className === "upload" || el.className === "back")
          continue;

        el.classList.remove('selected');
        if (el.getElementsByTagName("p")[0].innerHTML == lastSelected) {
          indexLastSelected = index;
        }
        if (el.getElementsByTagName("p")[0].innerHTML == file.name) {
          indexSelected = index;
        }
      }

      for (let i = Math.min(indexSelected, indexLastSelected); i <= Math.max(indexSelected, indexLastSelected); i++) {
        if (i == indexLastSelected || files_list[i].className === "upload" || files_list[i].className === "back")
          continue;
        files_list[i].classList.add('selected');
        selected_files[id].push(files_list[i].getElementsByTagName("p")[0].innerHTML)
      }
      files_list[indexLastSelected].classList.add('selected');
      selected_files[id].push(files_list[indexLastSelected].getElementsByTagName("p")[0].innerHTML)

    } else {
      if (file.type == "folder") {
        openFolder(file.name, id);

      } else {
        const files_list = document.getElementById(`files_${id}`).getElementsByTagName("li");
        selected_files[id] = [];
        for (const el of files_list) {
          if (el.getElementsByTagName("p")[0].innerHTML == file.name && !el.classList.contains('selected')) {
            el.classList.add('selected');
            selected_files[id].push(file.name);
          } else {
            el.classList.remove('selected');
          }
        }
      }
    }
  }
  ul.appendChild(li);
}

function addBackButton(id) {
  var ul = document.getElementById(`files_${id}`);
  var li = document.createElement("li");
  li.innerHTML = `
    <img src="./static/img/arrow.svg" class="back">
    <p>..</p>
  `;
  li.className = "back";
  li.onclick = function() {
    back(id);
  }
  ul.appendChild(li);
}

function openFolder(name, id) {
  pathArr[id].push(name);
  listFiles(id);
}

function back(id) {
  pathArr[id].pop();
  listFiles(id);
}

////////////////////////////////////////////////////////////////////////////////

function remove(path, type, id) {
  if (type == "folder") {
    sftp_obj.unlink(path, (err) => {
      listFiles(id);
    });
  } else {
    sftp_obj.rmdir(path, (err) => {
      listFiles(id);
    });
  }
}

function create_file(name, id, onEnd=undefined) {

}

function create_directory_from_alert() {
  create_directory(
    document.getElementById('name').value,
    Number(selected_file.id.split("_")[1]),
    function() {
      close_alert();
    }
  );
}

function create_directory(name, id, onEnd=undefined) {
  const dirPath = `${convert_path(pathArr[id])}/${name}`;
  sftp_obj.mkdir(dirPath, (err) => {
    listFiles(id);
    if (onEnd) onEnd();
    if (err) alert_error(err.toString());
  });
}

function cut() {
  const id = Number(selected_file.id.split("_")[1]);
  clipboard.files = JSON.parse(JSON.stringify(selected_files[id]));
  clipboard.path = convert_path(pathArr[id]);
  if (selected_li_file) {
    clipboard.files.push(selected_li_file.getElementsByTagName("p")[0].innerHTML)
  }
  clipboard.action = 'cut';
  console.log("CUT", clipboard);
}

function copy() {
  const id = Number(selected_file.id.split("_")[1]);
  clipboard.files = JSON.parse(JSON.stringify(selected_files[id]));
  clipboard.path = convert_path(pathArr[id]);
  if (selected_li_file) {
    clipboard.files.push(selected_li_file.getElementsByTagName("p")[0].innerHTML)
  }
  clipboard.action = 'copy';
  console.log("COPY", clipboard);
}

function conn_cp(remoteFilePath, destinationPath, onloadFunc=undefined) {
  conn.exec(`cp ${remoteFilePath} ${destinationPath}`, (err, stream) => {
    if (onloadFunc) onloadFunc(err);
    if (err) alert_error(err.toString());
  });
}

function paste() {
  const targetId = Number(selected_file.id.split("_")[1]);
  for (const file of clipboard.files) {
    const sourcePath = clipboard.path + "/" + file;
    const destPath = convert_path(pathArr[targetId]);
    console.log(sourcePath, destPath, file);
    if (clipboard.action === 'cut') {
      // Перемещение файла
      sftp_obj.rename(sourcePath, destPath + "/" + file, (err) => {
        if (err) alert_error(err.toString());
        listFiles(targetId);
      });
    } else if (clipboard.action === 'copy') {
      // Копирование файла
      conn_cp(sourcePath, destPath, (err) => {
        if (err) alert_error(err.toString());
        listFiles(targetId);
      });
    }
  }
  clipboard.files = [];
}

////////////////////////////////////////////////////////////////////////////////

document.getElementById('menu_files').addEventListener('contextmenu', (event) => {
  event.preventDefault()

  var element = event.target;
  var li_element = undefined;
  var selected = false;
  var selected_one = false;
  if (element.tagName != "LI" && element.tagName != "UL") {
    li_element = element.parentElement;
    element = li_element.parentElement;
  } else if (element.tagName == "LI") {
    li_element = element;
    element = li_element.parentElement;
  }

  selected_file = element;
  selected_li_file = li_element;

  // if (li_element !== undefined && li_element.classList.contains('selected')) {
  if (selected_files[Number(element.id.split("_")[1])].length > 0) {
    selected = true;
  }
  if (selected_files[Number(element.id.split("_")[1])].length == 1) {
    selected_one = true;
  }

  console.log(element, li_element, selected);

  ipcRenderer.send('show-context-menu', {
    target: "connection",
    id: `${group_id}_${item_id}`,
    function: "sftp_context",
    template: [
      // {
      //   label: 'Create',
      //   submenu: [
      //     {
      //       label: "File"
      //     }, {
      //       label: "Folder"
      //     }
      //   ]
      // }, {
      {
        label: 'New folder',
        enabled: true
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        enabled: (selected || !!li_element),
        accelerator: "CommandOrControl+X"
      }, {
        label: 'Copy',
        enabled: (selected || !!li_element),
        accelerator: "CommandOrControl+C"
      }, {
        label: 'Paste',
        enabled: (clipboard.files.length > 0),
        accelerator: "CommandOrControl+V"
      }, {
        type: 'separator'
      }, {
        label: 'Delete',
        enabled: (selected || !!li_element),
        accelerator: "Delete"
      }, {
        label: 'Rename',
        enabled: (selected_one || !!li_element),
        accelerator: "F2"
      }
      // }, {
      //   type: 'separator'
      // }, {
      //   label: 'Properties',
      //   enabled: (selected_one || !!li_element)
      // }
    ]
  })
});

function sftp_context(data) {
  console.log(group_id, item_id, data);
  switch (data) {
    case "New folder": {
      alert_new_folder();
      break;
    }
    case "Copy": {
      copy();
      break;
    }
    case "Cut": {
      console.log("asluidhjkf");
      cut();
      break;
    }
    case "Paste": {
      paste();
      break;
    }
    case "Rename": {
      break;
    }
    case "Delete": {
      break;
    }
    default:
      break;
  }
}

////////////////////////////////////////////////////////////////////////////////

function upload_file(file, remotePathArr) {
  const remotePath = convert_path(remotePathArr) + "/" + file.name;

  return new Promise((resolve, reject) => {
    if (fs.lstatSync(file.path).isDirectory()) {
      sftp_obj.mkdir(remotePath, (err) => {
        if (err) {
          return reject(err);
        }
        console.log(`Directory created: ${remotePath}`);
        uploadDirectory(file.path, [...remotePathArr, file.name]).then(resolve).catch(reject);
      });
    } else {
      sftp_obj.fastPut(file.path, remotePath, {}, (err) => {
        if (err) {
          return reject(err);
        }
        console.log(`File uploaded successfully: ${remotePath}`);
        resolve();
      });
    }
  });
}

function uploadDirectory(localPath, remotePathArr) {
  return new Promise((resolve, reject) => {
    fs.readdir(localPath, (err, items) => {
      if (err) {
        return reject(err);
      }

      let itemsCount = items.length;
      if (itemsCount === 0) {
        console.log(`Directory is empty: ${localPath}`);
        return resolve();
      }

      let uploadPromises = items.map(item => {
        return upload_file({
          name: item,
          path: path.join(localPath, item)
        }, remotePathArr);
      });

      Promise.all(uploadPromises)
        .then(() => resolve())
        .catch(reject);
    });
  });
}

////////////////////////////////////////////////////////////////////////////////

for (let id = 0; id < 2; id++) {
  const dropZone = document.getElementById(`files_div_${id}`);
  document.addEventListener('DOMContentLoaded', () => {

    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (!dropZone.classList.contains('drag-over')) {
        dropZone.classList.add('drag-over');
      }
    });

    dropZone.addEventListener('dragleave', (event) => {
      const relatedTarget = event.relatedTarget;
      if (!dropZone.contains(relatedTarget)) {
        dropZone.classList.remove('drag-over');
      }
    });

    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropZone.classList.remove('drag-over');
      const files = event.dataTransfer.files;

      // Создаем массив промисов для загрузки файлов
      let uploadPromises = [];
      for (const file of files) {
        uploadPromises.push(upload_file(file, pathArr[id]));
      }

      // Ждем завершения всех загрузок
      Promise.all(uploadPromises)
        .then(() => {
          console.log("All files uploaded successfully for drop zone:", id);
          listFiles(id);
        }).catch(err => {
          if (err) alert_error(err.toString());
        });
    });
  });
}
