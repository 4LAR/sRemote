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
