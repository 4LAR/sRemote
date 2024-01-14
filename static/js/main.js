let { ipcRenderer } = require("electron")
const fs = require('fs');
const path = require('path');

/*----------------------------------------------------------------------------*/

// функция для скрытия эелемента
function closeModal(modalId) {
  try {
    var modal = document.getElementById(modalId);
    modal.style.display = "none";
  } catch {
  }
}

// функция для показа эелемента (если элемент скрыт)
function openModal(modalId) {
  try {
    var modal = document.getElementById(modalId);
    modal.style.display = "block";
  } catch {
  }
}

// добавить элемент в список (ul)
function append_to_ul(id, content, onclick=undefined, item_id="", className="") {
  var ul = document.getElementById(id);

  var li = document.createElement("li");
  li.innerHTML = content;
  li.className = className;
  li.setAttribute("id", item_id);
  if (onclick)
    li.onclick = onclick;

  ul.appendChild(li);
}

// очистить список (ul)
function clear_ul(id) {
  document.getElementById(id).innerHTML = '';
}

//
function debounce(func, wait_ms) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait_ms);
  };
}

//
function get_arg(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

/*----------------------------------------------------------------------------*/
