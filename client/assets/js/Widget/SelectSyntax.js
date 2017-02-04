Class("SelectSyntaxWidget", ["PreferenceWidget"]);

SelectSyntaxWidget.prototype.getReadPreference = function() {
  var self = this;
  return self.preference(true);
}

SelectSyntaxWidget.prototype.preference = function(acceptVirtual) {
  acceptVirtual = acceptVirtual || false;
  var self = this;
  var extension = application.controllers.editor.file ? application.controllers.editor.file.extension() : '';
  var p = StringPreference.find("syntaxes["+extension+"]");
  if(p.getValue()) {
    return p;
  }
  else if(!acceptVirtual) {
    return p;
  }
  else if(application.controllers.editor.file) {
    self.virtualPreference = self.virtualPreference || new StringPreference({key:"virtual_syntax", value:application.controllers.editor.file.ace_js_mode});
    return self.virtualPreference;
  }
  else {
    return p;
  }
}

SelectSyntaxWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.setSyntaxMode(self.preference(true).getValue());
}

SelectSyntaxWidget.prototype.setSyntaxMode = function(syntax){
  var self = this;
  self.preference(true);
  if(self.virtualPreference) {
    self.virtualPreference.value = syntax;
  }
  self.refreshFromPreference();
}


