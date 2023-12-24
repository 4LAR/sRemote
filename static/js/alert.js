
function open_alert(html, big=false) {
  document.getElementById("alert_body").innerHTML = html;
  if (big) {
    document.getElementById("alert").className = "big_alert";
  } else {
    document.getElementById("alert").className = "alert";
  }

  openModal('bg_alert');
  openModal('alert');
}

function close_alert() {
  closeModal('bg_alert');
  closeModal('alert');
}

close_alert();
