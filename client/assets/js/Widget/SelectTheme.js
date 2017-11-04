Class("SelectThemeWidget", ["PreferenceWidget"]);

SelectThemeWidget.prototype.preference = function() {
  return StringPreference.find('theme'); 
}

SelectThemeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.editor_view.setTheme(self.preference().getValue());
  setTimeout(function() {
    $("html").css("background-color", $(".ace_scroller").css("background-color"));
  }, 100);
}




