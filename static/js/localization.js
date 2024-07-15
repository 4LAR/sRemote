
var localization_dict = {};

function read_localization(lang) {
  localization_dict = JSON.parse(fs.readFileSync(
    `./static/langs/${lang}.json`,
    {encoding: 'utf8', flag: 'r'}
  ));

  document.getElementById("empty_list_text").innerHTML = localization_dict.empty_list;
  document.getElementById("search").placeholder = localization_dict.search;
}
