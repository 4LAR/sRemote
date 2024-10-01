
var pathStr = ["", ""]
var sftp_obj = undefined;

function listFiles() {
  sftp_obj.readdir('/', (err, list) => {
    if (err) throw err;
    for (const file of list) {
      appendFileList(file);
    }
  });
}

function clearFileList() {

}

function appendFileList(file) {
  var ul = document.getElementById("files_left");
  console.log(ul);
  var file_type = "file";
  if (file.longname[0] == "d") {
    file_type = "folder";
  }
  console.log(file_type, file);
  var li = document.createElement("li");
  li.innerHTML = `
    <img src="./static/img/files/${file_type}.svg" class="${file_type}">
    <p>${file.filename}</p>
  `;
  ul.appendChild(li);
}

function openFolder() {

}
