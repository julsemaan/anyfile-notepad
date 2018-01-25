Class("FontSizeWidget", ["PreferenceWidget"]);

FontSizeWidget.prototype.prefValToWidgetVal = function(val) {
  // For retro-compatibility with the previous format which was using em instead of px
  emMatch = val.match(/([0-9.]+)em$/)
  if(emMatch) {
    val = emMatch[1] * 16;
    val += "px";
  }

  return val;
}

FontSizeWidget.prototype.preference = function() {
  return StringPreference.find('ace_js_font_size'); 
}

FontSizeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.editor_view.setFontSize(self.preference().getValue());
}

