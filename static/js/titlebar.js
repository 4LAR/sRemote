const packageJson = require('./package.json');
document.getElementById('app_name').innerHTML = `sRemote ${packageJson.version}`;

document.getElementById('hide-button').addEventListener('click', () => {
  ipcRenderer.send('hide-window');
});

document.getElementById('minmax-button').addEventListener('click', () => {
  ipcRenderer.send('maximize-minimize-window');
});

document.getElementById('close-button').addEventListener('click', () => {
  ipcRenderer.send('close-window');
});

ipcRenderer.on('maximize', (event, response) => {
  document.getElementById('minmax-button').getElementsByTagName('IMG')[0].src = `./static/img/titleBar/${response? "min": "max"}.svg`
});

// console.log({ platform: currentOS, release: osRelease });
// 'darwin', 'win32', 'linux', etc.