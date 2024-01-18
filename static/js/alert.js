

var onclose_alert_function = undefined;
function open_alert(html, type="alert", onclose=undefined) {
  document.getElementById("alert_body").innerHTML = html;
  document.getElementById("alert").className = type;

  onclose_alert_function = onclose;

  openModal('bg_alert');
  openModal('alert');
}

function close_alert(onclose=true) {
  closeModal('bg_alert');
  closeModal('alert');

  if (onclose_alert_function && onclose) {
    onclose_alert_function();
  }
}

close_alert();
