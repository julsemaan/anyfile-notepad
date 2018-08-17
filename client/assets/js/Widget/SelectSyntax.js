Class("SelectSyntaxWidget", ["PreferenceWidget"]);

SelectSyntaxWidget.prototype.virtualPreference = function() {
  var self = this;
  self._virtualPreference = self._virtualPreference || new StringPreference({key:"virtual_syntax"});
  if(!self._virtualPreference.value && application.controllers.editor.file) {
    self._virtualPreference.value = application.controllers.editor.file.compute_syntax().ace_js_mode;
  }
  return self._virtualPreference;
}

SelectSyntaxWidget.prototype.getReadPreference = function() {
  var self = this;
  return self.preference().value ? self.preference() : self.virtualPreference();
}

SelectSyntaxWidget.prototype.preference = function() {
  var self = this;
  var extension = application.controllers.editor.file ? application.controllers.editor.file.extension() : '';
  var p = StringPreference.find("syntaxes["+extension+"]");
  
  return p;
}

SelectSyntaxWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  if(application.controllers.editor.file) {
    if(self.preference().value) {
      self.virtualPreference().value = self.preference().value;
    }
    else {
      self.virtualPreference().value = application.controllers.editor.file.ace_js_mode;
    }
  }

  application.controllers.editor.setSyntaxMode(self.virtualPreference().getValue());
}

SelectSyntaxWidget.prototype.setSyntaxMode = function(syntax){
  var self = this;
  self.virtualPreference().value = syntax;
  self.refreshFromPreference();
}


