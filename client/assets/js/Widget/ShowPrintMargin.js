Class("ShowPrintMarginWidget", ["PreferenceWidget"]);

ShowPrintMarginWidget.prototype.preference = function() {
  return BooleanPreference.find('show_print_margin'); 
}

ShowPrintMarginWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.editor_view.setShowPrintMargin(self.preference().getValue());
}



