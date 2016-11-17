Class("FontSizeWidget", ["PreferenceWidget"]);

FontSizeWidget.prototype.preference = function() {
  return StringPreference.find('ace_js_font_size'); 
}

FontSizeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  self.editor_controller.editor_view.setFontSize(self.preference().getValue());
}

