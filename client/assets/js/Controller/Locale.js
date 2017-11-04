Class("LocaleController", ["Model"]);

LocaleController.prototype.post_init = function() {
  var self = this;
  self.nameMap = {};
  self.translations = {};
  self.findLocale();
}

LocaleController.prototype.addLocale = function(id, name, translations) {
  var self = this;
  self.nameMap[id] = name;
  self.translations[id] = translations;
  String.toLocaleString(self.translations);
}

LocaleController.prototype.findLocale = function() {
  var desired_locale = getCookie("locale");
  if(desired_locale && desired_locale != "auto"){
    String.locale = desired_locale;
  }
}

LocaleController.prototype.i18n = function(string) {
  return string.toLocaleString();
}
