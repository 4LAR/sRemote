packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, `package.json`), { encoding: 'utf8', flag: 'r' }))

document.getElementById('app_name').innerHTML = `sRemote ${packageJson.version}`;
document.title = `sRemote ${packageJson.version}`;

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
