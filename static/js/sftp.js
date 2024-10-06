
var pathArr = [[], []];
var sftp_obj = undefined;
var selected_files_id = [];
var split_flag = false;
var selected_files = [[], []];

////////////////////////////////////////////////////////////////////////////////

function split() {
  split_flag = !split_flag;
  if (split_flag) {
    document.getElementById("files_0").style.width = "50%";
    document.getElementById("files_1").style.width = "50%";
    document.getElementById("files_toolBar_0").style.width = "50%";
    document.getElementById("files_toolBar_1").style.width = "50%";
    if (pathArr[1].length < 1) {
      pathArr[1] = pathArr[0].map((element) => element);
      listFiles(1);
    }
  } else {
    document.getElementById("files_0").style.width = "100%";
    document.getElementById("files_1").style.width = "0%";
    document.getElementById("files_toolBar_0").style.width = "100%";
    document.getElementById("files_toolBar_1").style.width = "0%";
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
    document.getElementById(`path_${id}`).innerHTML = convert_path(pathArr[id]);
    if (pathArr.length > 0)
      addBackButton(id);
    appendUploadFrame(id);
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

function clearSelection(id) {
  const ul = document.getElementById(`files_${id}`);
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
      const lastSelected = selected_files[id].pop()
      selected_files[id] = [];
      ...
    } else {
      if (file.type == "folder")
        openFolder(file.name, id);
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

function appendUploadFrame(id) {
  var ul = document.getElementById(`files_${id}`);
  var li = document.createElement("li");
  li.innerHTML = `
    <div></div>
    <div>
      <img src="./static/img/upload.svg">
      <p>Drop your files here</p>
    </div>
  `;
  li.className = "upload";
  ul.appendChild(li);
}

////////////////////////////////////////////////////////////////////////////////

function upload_file(file, id=0) {
  const remotePath = convert_path(pathArr[id]) + "/" + file.name;

  if (fs.lstatSync(file.path).isDirectory()) {
    sftp_obj.mkdir(remotePath, (err) => {
      console.log(`Directory created: ${remotePath}`);
      uploadDirectory(file.path, remotePath, id);
    });
  } else {
    sftp_obj.fastPut(file.path.replaceAll('\\', '/'), remotePath, {}, (err) => {
      listFiles(id);
      console.log('File uploaded successfully');
    });
  }
}

function uploadDirectory(localPath, remotePath, id) {
  const fs = require('fs');
  const path = require('path');

  fs.readdir(localPath, (err, items) => {
    let itemsCount = items.length;
    if (itemsCount === 0) {
      console.log(`Directory is empty: ${localPath}`);
      return;
    }

    items.forEach(item => {
      const itemPath = path.join(localPath, item);
      const remoteItemPath = path.join(remotePath, item);

      fs.stat(itemPath, (err, stats) => {
        if (stats.isDirectory()) {
          sftp_obj.mkdir(remoteItemPath, (err) => {
            console.log(`Directory created: ${remoteItemPath}`);
            uploadDirectory(itemPath, remoteItemPath, id);
          });
        } else {
          sftp_obj.fastPut(itemPath.replaceAll('\\', '/'), remoteItemPath, {}, (err) => {
            console.log(`File uploaded successfully: ${remoteItemPath}`);
          });
        }

        itemsCount--;
        if (itemsCount === 0) {
          listFiles(id);
        }
      });
    });
  });
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

function create_file(path, name, id) {

}

function create_directory(path, name, id) {
  mkdir.unlink(path + "/" + name, (err) => {
    listFiles(id);
  });
}

////////////////////////////////////////////////////////////////////////////////

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  ipcRenderer.send('show-context-menu', {
    target: "connection",
    id: `${group_id}_${item_id}`,
    function: "sftp_context",
    template: [
      {
        label: 'Create',
        submenu: [
          {
            label: "File"
          }, {
            label: "Folder"
          }
        ]
      }, {
        type: 'separator'
      }, {
        label: 'Cut'
      }, {
        label: 'Copy'
      }, {
        label: 'Paste'
      }, {
        type: 'separator'
      }, {
        label: 'Delete'
      }, {
        label: 'Rename'
      }, {
        type: 'separator'
      }, {
        label: 'Properties'
      }
    ]
  })
});

function sftp_context(data) {
  console.log(group_id, item_id, data);

}

////////////////////////////////////////////////////////////////////////////////

for (let id = 0; id < 2; id++) {
  const dropZone = document.getElementById(`files_${id}`);
  document.addEventListener('DOMContentLoaded', () => {

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
      for (const file of files) {
        upload_file(file, id)
      }
    });
  });
}
