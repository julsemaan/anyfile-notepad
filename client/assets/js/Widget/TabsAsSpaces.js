Class("TabsAsSpacesWidget", ["PreferenceWidget"]);

TabsAsSpacesWidget.prototype.preference = function() {
  return BooleanPreference.find('tabs_as_spaces'); 
}

TabsAsSpacesWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  application.controllers.editor.editor_view.getSession().setUseSoftTabs(self.preference().getValue())
}



