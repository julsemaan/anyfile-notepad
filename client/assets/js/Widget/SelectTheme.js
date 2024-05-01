Class("SelectThemeWidget", ["PreferenceWidget"]);

SelectThemeWidget.prototype.preference = function() {
  return StringPreference.find('theme'); 
}

SelectThemeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  var theme = self.preference().getValue();
  if(theme == "__default__") {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = "ace/theme/tomorrow_night_eighties";
    }
  }
  application.controllers.editor.editor_view.setTheme(theme);
  setTimeout(function() {
    $("html").css("background-color", $(".ace_scroller").css("background-color"));
  }, 100);
}




