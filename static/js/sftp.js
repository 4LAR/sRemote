
var pathArr = [[], []];
var sftp_obj = undefined;
var selected_files_id = [];
var split_flag = false;

////////////////////////////////////////////////////////////////////////////////

function split() {
  split_flag = !split_flag;
  if (split_flag) {
    document.getElementById("files_0").style.width = "50%";
    document.getElementById("files_1").style.width = "50%";
    if (pathArr[1].length < 1) {
      pathArr[1] = pathArr[0];
      listFiles(1);
    }
  } else {
    document.getElementById("files_0").style.width = "100%";
    document.getElementById("files_1").style.width = "0%";
  }
}

////////////////////////////////////////////////////////////////////////////////

function convert_path(arr) {
  return "/" + arr.join("/");
}

function listFiles(id=0) {
  clearFileList(id);

  var files = [];
  sftp_obj.readdir(convert_path(pathArr[id]), (err, list) => {
    if (err) {
      pathArr[id] = [];
      listFiles(id);
      return;
    }
    // document.getElementById("path").innerHTML = convert_path(pathArr);
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
  if (file.type == "folder") {
    li.onclick = function() {
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

function upload_file(file) {
  console.log(file.path.replaceAll('\\', '/'), convert_path(pathArr) + "/" + file.name);
  sftp_obj.fastPut(file.path.replaceAll('\\', '/'), convert_path(pathArr) + "/" + file.name, {}, (err) => {
    if (err) {
      console.error(err);
      return;
    };
    listFiles();
    console.log('File uploaded successfully');
  });
}

////////////////////////////////////////////////////////////////////////////////

const dropZone = document.getElementById("menu_files");

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
    const files = event.dataTransfer.files;
    for (const file of files) {
      upload_file(file)
    }

    // dropZone.classList.remove('drag-over');
    //
    // const files = event.dataTransfer.files;
    //
    // if (files.length > 0) {
    //   const filePath = files[0].path;
    //   read_import_file(filePath);
    // }
  });
});
