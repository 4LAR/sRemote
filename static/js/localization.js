
const current_lang = "en";
var localization_dict = {};

function read_localization(lang) {
  var obj;
  fs.readFile(`./static/langs/${lang}.json`, 'utf8', function (err, data) {
    if (err) throw err;
    localization_dict = JSON.parse(data);

    document.getElementById("empty_list_text").innerHTML = localization_dict.empty_list;
    document.getElementById("search").placeholder = localization_dict.search;
  });
}

read_localization(current_lang);
