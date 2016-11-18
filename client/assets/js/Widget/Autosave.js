Class("AutosaveWidget", ["PreferenceWidget"]);

AutosaveWidget.prototype.preference = function() {
  return BooleanPreference.find('autosave'); 
}

AutosaveWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  if(self.preference().getValue()) {
    self.editor_controller.activate_autosave()
  }
  else {
    self.editor_controller.deactivate_autosave()
  }
}


