Class("ShowAllCharactersWidget", ["PreferenceWidget"]);

ShowAllCharactersWidget.prototype.preference = function() {
  return BooleanPreference.find('show_all_characters'); 
}

ShowAllCharactersWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.editor_view.setOption("showInvisibles", self.preference().getValue());
}



