let { ipcRenderer } = require("electron")
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v6: uuid } = require('uuid');

const root = document.querySelector(':root');

const currentOS = os.platform();
const osRelease = os.release();

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
function append_to_ul(id, content, onclick=undefined, item_id="", className="", ondblclick=undefined) {
  var ul = document.getElementById(id);

  var li = document.createElement("li");
  li.innerHTML = content;
  li.className = className;
  li.setAttribute("id", item_id);
  if (onclick)
    li.onclick = onclick;

  if (ondblclick)
    li.ondblclick = ondblclick;

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

// генерация <select>
// data = {"name1": "value1", "name2": "value2"}
function select_generator(data, id="", classList="", selected=0) {
  var result = "";
  for (const key in data) {
    result += `<option value="${data[key]}" ${(selected == data[key])? "selected": ""}>${key}</option>`;
  }
  return `<select id="${id}" class="${classList}">${result}</select>`;
}

// вычисление логарифма
function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

var size_name = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
// конвертирование байтов в [size_name]
function convert_size(size_bytes, name_bool=false) {
  if (size_bytes == 0)
    if (name_bool)
      return [0, 'B', 0]
    else
      return '0 B';

  i = Math.floor(getBaseLog(1024, size_bytes)); // индекс названия
  p = Math.pow(1024, i);
  s = Math.round((size_bytes / p) * 100) / 100; // размер

  if (name_bool)
    return [s, size_name[i], i]
  else
    return s + ' ' + size_name[i]
}

// onkeydown
function onEnter(el, func=()=>{}) {
  if(event.key === 'Enter') {
    func();
  }
}

function calculateWidthInput(input) {
  const tempSpan = document.createElement('span');
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.whiteSpace = 'pre';
  tempSpan.style.font = window.getComputedStyle(input).font;
  tempSpan.textContent = input.value || input.placeholder || '';

  document.body.appendChild(tempSpan);
  const width = tempSpan.getBoundingClientRect().width;
  document.body.removeChild(tempSpan);

  return width;
}

function spliceNoMutate(myArray,indexToRemove) {
  return myArray.slice(0,indexToRemove).concat(myArray.slice(indexToRemove+1));
}

/*----------------------------------------------------------------------------*/

function getAllMethods(obj) {
  return Object.getOwnPropertyNames(obj).filter(
    (property) => typeof obj[property] === 'function'
  );
}

/*----------------------------------------------------------------------------*/
