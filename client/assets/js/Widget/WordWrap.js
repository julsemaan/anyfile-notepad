Class("WordWrapWidget", ["PreferenceWidget"]);

WordWrapWidget.prototype.preference = function() {
  return BooleanPreference.find('word_wrap'); 
}

WordWrapWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.editor_view.getSession().setUseWrapMode(self.preference().getValue())
}



