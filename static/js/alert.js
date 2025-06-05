

var onclose_alert_function = undefined;
var alert_onclose_flag = true;
function open_alert(html, type="alert", onclose=undefined) {
  document.getElementById("alert_body").innerHTML = html;
  document.getElementById("alert").className = "";
  document.getElementById("alert").classList.add(type);
  if (SETTINGS_DICT["Appearance"]["animationWindow"]) {
    document.getElementById("alert").classList.add("alert-on-create");
  }

  onclose_alert_function = onclose;

  openModal('bg_alert');
  openModal('alert');
}

function close_alert(onclose=true, onclose_function=undefined) {
  if (SETTINGS_DICT["Appearance"]["animationWindow"]) {
    document.getElementById("alert").classList.remove("alert-on-create");
    document.getElementById("alert").classList.add("alert-on-close");
  }

  if (onclose_function) {
    onclose_alert_function = onclose_function;
  }

  alert_onclose_flag = onclose;
  if (!SETTINGS_DICT["Appearance"]["animationWindow"]) {
    closeModal('bg_alert');
    closeModal('alert');
    if (onclose_alert_function && onclose) {
      onclose_alert_function();
    }
  }
}

document.getElementById("alert").addEventListener("animationend", function(e) {
  document.getElementById("alert").classList.remove("alert-on-create");
  document.getElementById("alert").classList.remove("alert-on-close");
  if (e.animationName == "fadeOut" || e.animationName == "fadeOutReversed") {
    closeModal('bg_alert');
    closeModal('alert');
    if (onclose_alert_function && alert_onclose_flag) {
      onclose_alert_function();
    }
  }
});

closeModal('bg_alert');
closeModal('alert');

// close_alert();

document.addEventListener('keydown', function(event){
  if (event.keyCode == 27) {
    close_alert();
  }
});
