Class("SelectThemeWidget", ["PreferenceWidget"]);

SelectThemeWidget.prototype.preference = function() {
  return StringPreference.find('theme'); 
}

SelectThemeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  self.editor_controller.editor_view.setTheme(self.preference().getValue());
}




