Class("SelectSyntaxWidget", ["PreferenceWidget"]);

SelectSyntaxWidget.prototype.getReadPreference = function() {
  var self = this;
  return self.preference(true);
}

SelectSyntaxWidget.prototype.preference = function(acceptVirtual) {
  acceptVirtual = acceptVirtual || false;
  var self = this;
  var extension = self.editor_controller.file ? self.editor_controller.file.extension() : '';
  var p = StringPreference.find("syntaxes["+extension+"]");
  if(p.getValue()) {
    return p;
  }
  else if(!acceptVirtual) {
    return p;
  }
  else if(self.editor_controller.file) {
    self.virtualPreference = self.virtualPreference || new StringPreference({key:"virtual_syntax", value:self.editor_controller.file.ace_js_mode});
    return self.virtualPreference;
  }
  else {
    return p;
  }
}

SelectSyntaxWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  self.editor_controller.setSyntaxMode(self.preference(true).getValue());
}

SelectSyntaxWidget.prototype.setSyntaxMode = function(syntax){
  var self = this;
  self.preference(true);
  if(self.virtualPreference) {
    self.virtualPreference.value = syntax;
  }
  self.refreshFromPreference();
}


