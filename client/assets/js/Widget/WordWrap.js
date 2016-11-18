Class("WordWrapWidget", ["PreferenceWidget"]);

WordWrapWidget.prototype.preference = function() {
  return BooleanPreference.find('autosave'); 
}

WordWrapWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  self.editor_controller.editor_view.getSession().setUseWrapMode(self.preference().getValue())
}



