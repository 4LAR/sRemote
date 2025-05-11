var data_path = get_arg("data_path");

const CACHE_PATH = `${data_path}\\terminal_cache\\${btoa(connection_config.search)}`;

if (config["Connections"]["cacheData"]) {
  const folderPath = data_path + "\\terminal_cache";
  if (!fs.existsSync(folderPath)) {
    fs.mkdir(folderPath, (err) => {
      if (err) {
        console.error('Error creating folder:', err);
      } else {
        console.log('Folder created successfully!');
      }
    });
  } else {
    console.log('Folder already exists.');
  }
}

function add_cache(newData) {
  // Читаем текущие данные из файла, если файл существует
  let existingData = '';
  if (fs.existsSync(CACHE_PATH)) {
    existingData = fs.readFileSync(CACHE_PATH, 'utf-8');
  }

  // Объединяем существующие данные с новыми данными
  const combinedData = existingData + newData;

  // Если общий объем данных превышает 5000 байт, обрезаем лишнее
  if (combinedData.length > config["Connections"]["maxCacheData"]) {
    const startIndex = combinedData.length - config["Connections"]["maxCacheData"];
    existingData = combinedData.slice(startIndex);
  } else {
    existingData = combinedData;
  }

  // Записываем данные обратно в файл
  fs.writeFileSync(CACHE_PATH, existingData);
}

function read_cache() {
  try {
    const fileContents = fs.readFileSync(CACHE_PATH, 'utf-8');
    return fileContents
  } catch (e) {
    return ""
  }

}
