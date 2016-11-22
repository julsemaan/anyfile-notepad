Class("SelectSyntaxWidget", ["PreferenceWidget"]);

SelectSyntaxWidget.prototype.preference = function() {
  var self = this;
  var extension = self.editor_controller.file ? self.editor_controller.file.extension() : '';
  return StringPreference.find("syntaxes["+extension+"]"); 
}

SelectSyntaxWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  console.log("changed");
  self.editor_controller.setSyntaxMode(self.preference().getValue());
  //self.editor_controller.editor_view.setTheme(self.preference().getValue());
}


