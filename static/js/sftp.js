
var pathStr = ["", ""]
var sftp_obj = undefined;

function listFiles() {
  sftp_obj.readdir('/home/stolar', (err, list) => {
    if (err) throw err;
    console.dir(list);
    conn.end();
  });
}

function clearFileList() {
  
}

function appendFileList() {

}

function openFolder() {

}
