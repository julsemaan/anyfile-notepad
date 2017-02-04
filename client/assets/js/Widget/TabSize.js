Class("TabSizeWidget", ["PreferenceWidget"]);

TabSizeWidget.prototype.preference = function() {
  return StringPreference.find('ace_js_tab_size'); 
}

TabSizeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.editor_view.getSession().setTabSize(self.preference().getValue())
}


