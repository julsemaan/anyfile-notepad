Class("PreferencesController", ["Model"]);

PreferencesController.prototype.post_init = function() {
  var self = this;

  self.widgets = {
    fontSize: new FontSizeWidget({}),
    autosave: new AutosaveWidget({}),
    wordWrap: new WordWrapWidget({}),
    tabSize: new TabSizeWidget({}),
    editorMode: new EditorModeWidget({}),
    selectTheme: new SelectThemeWidget({}),
    selectSyntax: new SelectSyntaxWidget({}),
    showAllCharacters: new ShowAllCharactersWidget({}),
    showPrintMargin: new ShowPrintMarginWidget({}),
    tabsAsSpaces: new TabsAsSpacesWidget({}),
  };

  $(document).on('preference-change-in-progress', function() {
    for(var k in self.widgets) {
      self.widgets[k].disable();
    }
  });
  
  $(document).on('preference-change-done', function() {
    for(var k in self.widgets) {
      self.widgets[k].enable();
    }
  });


}
