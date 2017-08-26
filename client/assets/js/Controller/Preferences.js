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

// Adds a new user-based known combination of extension + mime type
PreferencesController.prototype.add_known_mt_ext = function(mime_type, extension) {
  var mt_ext = mime_type + "/" + extension;
  $(document).trigger('preference-change-in-progress');

  pref = ArrayPreference.find("user_mimetypes");
  pref.array.push(mt_ext);
  pref.commit(application.controllers.editor, application.controllers.google_oauth.show_reauth).then(function() {
    $(document).trigger('preference-change-done');
  })
}
