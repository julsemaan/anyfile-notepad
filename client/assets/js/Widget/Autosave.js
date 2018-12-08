Class("AutosaveWidget", ["PreferenceWidget"]);

AutosaveWidget.prototype.preference = function() {
  return BooleanPreference.find('autosave'); 
}

AutosaveWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  if(self.preference().getValue()) {
    application.controllers.editor.activate_autosave()
  }
  else {
    application.controllers.editor.deactivate_autosave()
  }
  console.log(application.controllers.editor.autosave_enabled);
}


