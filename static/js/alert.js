
function open_alert(html, type="alert") {
  document.getElementById("alert_body").innerHTML = html;
  document.getElementById("alert").className = type;

  openModal('bg_alert');
  openModal('alert');
}

function close_alert() {
  closeModal('bg_alert');
  closeModal('alert');
}

close_alert();
