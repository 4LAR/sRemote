
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
    <p class="error_text">${text}</p>
    <div class="button submit" onclick="close_alert()">
      <p>Ok</p>
    </div>
  `, 'alert_sftp_file')
}

function alert_rename() {

}

function alert_new_folderFile(fileFlag=false) {
  open_alert(`
    <p class="name">Create ${(fileFlag)? "file": "folder"}</p>
    <hr>
    <input id="name" class="input_style" type="text" placeholder="${(fileFlag)? "File": "Folder"} name">
    <div class="button submit" onclick="${(fileFlag)? "create_file_from_alert()": "create_directory_from_alert()"}">
      <p>Create</p>
    </div>
  `, 'alert_sftp_file')
  document.getElementById("name").focus()
}

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
  action: null,
  fromid: 0
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
  document.getElementById(`files_loading_${id}`).style.display = "block";
  var files = [];
  sftp_obj.readdir(convert_path(pathArr[id]), (err, list) => {
    if (err) {
      pathArr[id] = [];
      listFiles(id);
      return;
    }
    document.getElementById(`path_${id}`).value = convert_path(pathArr[id]);
    if (pathArr[id].length > 0)
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
    document.getElementById(`files_loading_${id}`).style.display = "none";
  });
}

function clearFileList(id=0) {
  document.getElementById(`files_${id}`).innerHTML = "";
}

function clearSelectionEvent(event, id) {
  const otherId = Math.abs(id - 1);
  if (selected_files[otherId].length > 0) {
    clearSelection(otherId);
  } else if (event.target.tagName == "UL") {
    clearSelection(id);
  }
}

function clearSelection(id) {
  const ul = document.getElementById(`files_${id}`);
  selected_files[id] = [];
  for (let li of ul.children) {
    li.classList.remove('selected');
  }
}

function clearCut(id) {
  const ul = document.getElementById(`files_${id}`);
  selected_files[id] = [];
  for (let li of ul.children) {
    li.classList.remove('cut');
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

  // li.draggable = true;

  if (clipboard.files.includes(file.name) && clipboard.path == convert_path(pathArr[id])) {
    li.classList.add("cut");
  }

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

function create_file_from_alert() {
  const name_input = document.getElementById('name');
  if (!isValidLinuxFileName(name_input.value)) {
    name_input.className = "input_style input_warning";
    return;
  } else {
    name_input.className = "input_style";
  }
  //
  conn_new_file(
    convert_path(pathArr[Number(selected_file.id.split("_")[1])]),
    name_input.value,
    function() {
      listFiles(Number(selected_file.id.split("_")[1]));
      close_alert();
    }
  );
}

function create_directory_from_alert() {
  const name_input = document.getElementById('name');
  if (!isValidLinuxFileName(name_input.value)) {
    name_input.className = "input_style input_warning";
    return;
  } else {
    name_input.className = "input_style";
  }
  //
  create_directory(
    name_input.value,
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

function conn_new_file(remoteFilePath, filename, onloadFunc=undefined) {
  conn.exec(`touch ${remoteFilePath}/${filename}`, (err, stream) => {
    if (onloadFunc) onloadFunc(err);
    stream.on('data', function(data) {}).stderr.on('data', function(data) {
      alert_error(data.toString());
    });
    if (err) alert_error(err.toString());
  });
}

function cut() {
  const id = Number(selected_file.id.split("_")[1]);
  clipboard.fromid = id;
  clipboard.files = JSON.parse(JSON.stringify(selected_files[id]));
  clipboard.path = convert_path(pathArr[id]);
  if (selected_li_file && !clipboard.files.includes(selected_li_file.getElementsByTagName("p")[0].innerHTML)) {
    clipboard.files.push(selected_li_file.getElementsByTagName("p")[0].innerHTML);
  }
  clipboard.action = 'cut';
  clearCut(id);
  const filesList = document.getElementById(`files_${id}`).getElementsByTagName("li");
  for (const file of filesList) {
    if (clipboard.files.includes(file.getElementsByTagName("p")[0].innerHTML)) {
      file.classList.add("cut");
    }
  }
  console.log("CUT", clipboard);
}

function copy() {
  const id = Number(selected_file.id.split("_")[1]);
  clearCut(id);
  clipboard.fromid = id;
  clipboard.files = JSON.parse(JSON.stringify(selected_files[id]));
  clipboard.path = convert_path(pathArr[id]);
  if (selected_li_file && !clipboard.files.includes(selected_li_file.getElementsByTagName("p")[0].innerHTML)) {
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
  let completedOperations = 0;
  const totalOperations = clipboard.files.length;

  for (const file of clipboard.files) {
    const sourcePath = clipboard.path + "/" + file;
    const destPath = convert_path(pathArr[targetId]);

    if (clipboard.action === 'cut') {
      // Перемещение файла
      sftp_obj.rename(sourcePath, destPath + "/" + file, (err) => {
        if (err) alert_error(err.toString());
        completedOperations++;
        checkCompletion();
      });
    } else if (clipboard.action === 'copy') {
      // Копирование файла
      conn_cp(sourcePath, destPath, (err) => {
        if (err) alert_error(err.toString());
        completedOperations++;
        checkCompletion();
      });
    }
  }

  function checkCompletion() {
    if (completedOperations === totalOperations) {
      listFiles(targetId);
      if (clipboard.fromid != targetId) {
        listFiles(clipboard.fromid);
      }
      clipboard.files = []; // Очищаем буфер обмена
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

let activeStreams = [];

function stop_download() {
  stopDownloadFlag = true;

  activeStreams.forEach(stream => {
    try {
      stream.destroy();
    } catch (err) {
      console.error("Ошибка при остановке потока:", err);
    }
  });

  activeStreams = [];
}

function download(localFilePath) {
  stopUpload = false;
  totalTransferredBytes = 0;
  totalBytes = 0;

  const id = Number(selected_file.id.split("_")[1]);
  const files = JSON.parse(JSON.stringify(selected_files[id]));
  const path = convert_path(pathArr[id]);
  if (selected_li_file) {
    files.push(selected_li_file.getElementsByTagName("p")[0].innerHTML);
  }

  alert_upload_files();

  const downloadPromises = files.map(file => {
    const remoteFilePath = `${path}/${file}`;
    return statFile(remoteFilePath)
      .then(stats => {
        if ((stats.mode & 0o40000) === 0o40000) {
          return downloadFolder(file, remoteFilePath, localFilePath + `/${file}`);
        } else {
          return downloadFile(file, remoteFilePath, localFilePath + `/${file}`);
        }
      });
  });

  Promise.all(downloadPromises)
    .then(() => {
      if (!stopUpload) {
        onAllDownloadsComplete();
      }
    })
    .catch(err => {
      console.error("Ошибка при загрузке файлов:", err);
    });
}

function statFile(remoteFilePath) {
  return new Promise((resolve, reject) => {
    sftp_obj.stat(remoteFilePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

function downloadFolder(file, remoteFilePath, localFilePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(localFilePath)) {
      fs.mkdirSync(localFilePath);
    }
    sftp_obj.readdir(remoteFilePath, (err, list) => {
      if (err) {
        alert_error(`Ошибка получения списка файлов в директории ${file}: ${err.toString()}`);
        reject(err);
        return;
      }
      const folderPromises = list.map(file_r => {
        const fileName = file_r.filename;
        if (file_r.longname[0] == "d") {
          return downloadFolder(fileName, path.join(remoteFilePath, fileName).replaceAll("\\", "/"), path.join(localFilePath, fileName).replaceAll("\\", "/"));
        } else {
          return downloadFile(fileName, path.join(remoteFilePath, fileName).replaceAll("\\", "/"), path.join(localFilePath, fileName).replaceAll("\\", "/"));
        }
      });
      Promise.all(folderPromises).then(resolve).catch(reject);
    });
  });
}

function downloadFile(file, remoteFilePath, localFilePath) {
  console.log("Download file:", remoteFilePath, file);
  return new Promise((resolve, reject) => {
    if (stopUpload) {
      console.log(`Скачивание файла ${file} отменено.`);
      return reject(new Error("Скачивание отменено пользователем."));
    }

    statFile(remoteFilePath)
      .then(stats => {
        totalBytes += stats.size;
        const current_totalBytes = stats.size;
        let downloadedBytes = 0;

        append_file_to_list(file, current_totalBytes);

        const readStream = sftp_obj.createReadStream(remoteFilePath);
        const writeStream = fs.createWriteStream(localFilePath);

        // Добавляем потоки в активный список
        activeStreams.push(readStream, writeStream);

        readStream.on('data', (chunk) => {
          if (stopUpload) {
            readStream.destroy();
            writeStream.destroy();
            console.log(`Скачивание файла ${file} было остановлено.`);
            return reject(new Error("Скачивание остановлено пользователем."));
          }

          downloadedBytes += chunk.length;
          const progress = (downloadedBytes / current_totalBytes) * 100;

          // Обновляем прогресс файла
          update_file_progress(file, progress);

          // Обновляем общий прогресс
          totalTransferredBytes += chunk.length;
          update_overall_progress();
        });

        readStream.on('end', () => {
          console.log(`Файл ${file} успешно скачан в ${localFilePath}`);
          update_file_progress(file, 100, 'end');
          resolve();
        });

        readStream.on('error', (err) => {
          console.error(`Ошибка при скачивании ${file}: ${err}`);
          update_file_progress(file, 0, " error");
          reject(err);
        });

        // Удаляем потоки из активного списка при завершении
        readStream.on('close', () => {
          activeStreams = activeStreams.filter(s => s !== readStream && s !== writeStream);
        });

        readStream.pipe(writeStream);
      })
      .catch(err => {
        console.error(`Ошибка при получении информации о файле ${file}: ${err}`);
        reject(err);
      });
  });
}

function onAllDownloadsComplete() {
  close_alert();
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
      {
        label: 'Create',
        submenu: [
          {
            label: "Folder"
          }, {
            label: "File"
          }
        ]
      }, {
        type: 'separator'
      }, {
        label: 'Download',
        enabled: (selected || !!li_element)
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
        enabled: (selected_one || (!!li_element && selected_one)),
        accelerator: "F2"
      }
    ]
  })
});

function sftp_context(data) {
  console.log(group_id, item_id, data);
  switch (data) {
    case "Create_Folder": {
      alert_new_folderFile();
      break;
    }
    case "Create_File": {
      alert_new_folderFile(true);
      break;
    }
    case "Copy": {
      copy();
      break;
    }
    case "Cut": {
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
    case "Download": {
      ipcRenderer.send('save-files-folder-dialog', {
        target: "connection",
        id: `${group_id}_${item_id}`,
        function: "download",
        title: "Download path"
      })
      break;
    }
    default:
      break;
  }
}

////////////////////////////////////////////////////////////////////////////////

let stopUpload = false;         // Флаг для остановки загрузки
let totalTransferredBytes = 0;  // Сумма всех переданных байт
let totalBytes = 0;             // Общий размер всех файлов

function stop_upload() {
  stopUpload = true;
  console.log("Uploading has been stopped.");
}

function alert_upload_files(download_flag=false) {
  open_alert(`
    <p class="name">${download_flag? "Download": "Upload"} files</p>
    <hr>
    <ul id="upload_files_ul" class="scroll_style"></ul>
    <div id="upload_main_files_progress">
      <hr>
      <progress id="overall_progress" value="0" max="100"></progress>
    </div>
  `, 'alert_sftp_upload', function() {
    if (download_flag) {
      stop_upload();
    } else {
      stop_download();
    }
  });
}

function append_file_to_list(fileName, size) {
  const uploadList = document.getElementById("upload_files_ul");
  const listItem = document.createElement("li");
  listItem.innerHTML = `
    <p>${fileName} (${(size / 1024).toFixed(2)} KB)</p>
    <progress value="0" max="100" data-file="${fileName}"></progress>
  `;
  uploadList.appendChild(listItem);
}

function update_file_progress(fileName, percentage, status="") {
  const fileProgress = document.querySelector(`progress[data-file="${fileName}"]`);
  if (fileProgress) {
    fileProgress.value = percentage;
    fileProgress.className += status;
  }
}

function update_overall_progress() {
  const overallProgress = document.getElementById("overall_progress");
  const percentage = Math.floor((totalTransferredBytes / totalBytes) * 100);
  overallProgress.value = percentage;
}

function uploadDirectory(localPath, remotePathArr) {
  return new Promise((resolve, reject) => {
    fs.readdir(localPath, { withFileTypes: true }, (err, items) => {
      if (err) return reject(err);

      if (items.length === 0) {
        console.log(`Directory is empty: ${localPath}`);
        return resolve();
      }

      const uploadPromises = items.map(item => {
        const itemPath = path.join(localPath, item.name);
        const remoteItemPath = [...remotePathArr, item.name];

        if (item.isDirectory()) {
          return sftp_obj.mkdir(convert_path(remoteItemPath), (err) => {
            if (err && err.code !== 4) return Promise.reject(err); // Ошибка 4 — уже существует
            return uploadDirectory(itemPath, remoteItemPath);
          });
        } else {
          return upload_file({ name: item.name, path: itemPath }, remotePathArr);
        }
      });

      Promise.all(uploadPromises)
        .then(resolve)
        .catch(reject);
    });
  });
}

function upload_file(file, remotePathArr) {
  return new Promise((resolve, reject) => {
    const remotePath = convert_path(remotePathArr) + "/" + file.name;

    if (fs.lstatSync(file.path).isDirectory()) {
      sftp_obj.mkdir(remotePath, (err) => {
        if (err && err.code !== 4) return reject(err);
        uploadDirectory(file.path, [...remotePathArr, file.name])
          .then(resolve)
          .catch(reject);
      });
    } else {
      const fileStream = fs.createReadStream(file.path);
      const writeStream = sftp_obj.createWriteStream(remotePath);

      const fileSize = fs.lstatSync(file.path).size;
      let transferred = 0;

      totalBytes += fileSize;
      append_file_to_list(`${file.path.replaceAll("\\", "/")}/${file.name}`, fileSize);

      fileStream.pipe(writeStream);

      // Отслеживаем прогресс
      fileStream.on('data', (chunk) => {
        if (stopUpload) {
          console.log(`Stopping upload for file: ${file.name}`);
          fileStream.unpipe(writeStream); // Отключить поток от записи
          fileStream.destroy();           // Прервать чтение из файла
          writeStream.destroy();          // Прервать запись в файл на сервере
          // reject(new Error("Upload stopped."));
          return;
        }

        transferred += chunk.length;
        totalTransferredBytes += chunk.length;
        const percentage = Math.floor((transferred / fileSize) * 100);
        update_file_progress(`${file.path.replaceAll("\\", "/")}/${file.name}`, percentage);
        update_overall_progress();
      });

      // Обработка завершения
      writeStream.on('close', () => {
        update_file_progress(`${file.path.replaceAll("\\", "/")}/${file.name}`, 100, "end");
        resolve();
      });

      // Обработка ошибок
      fileStream.on('error', (err) => {
        console.log(`Error reading file: ${file.name}`, err);
        reject(err);
      });

      writeStream.on('error', (err) => {
        console.log(`Error writing file: ${file.name}`, err);
        reject(err);
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  for (let id = 0; id < 2; id++) {
    const dropZone = document.getElementById(`files_div_${id}`);

    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (event) => {
      if (!dropZone.contains(event.relatedTarget)) {
        dropZone.classList.remove('drag-over');
      }
    });

    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropZone.classList.remove('drag-over');

      const files = Array.from(event.dataTransfer.files);
      totalTransferredBytes = 0;
      totalBytes = 0;

      alert_upload_files();
      stopUpload = false;

      const uploadPromises = files.map(file => upload_file(file, pathArr[id]));

      Promise.all(uploadPromises)
        .then(() => {
          console.log("All files uploaded successfully for drop zone:", id);
          close_alert();
          listFiles(id);
        })
        .catch(err => {
          listFiles(id);
          alert_error(err.toString());
        });
    });
  }
});
