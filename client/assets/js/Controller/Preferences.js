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

  $('.known-encoding-add').click(function(e) { self.handle_add_known_mt_ext(e) });

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

PreferencesController.prototype.handle_add_known_ext = function(target) {
  var self = this;
  target = $(target);
  self.add_known_ext(target.attr('data-extension'));
  target.replaceWith('<i class=\'known-encoding-added material-icons btn-success\'>done</i>');
}

// Adds a new user-based known combination of extension + mime type
PreferencesController.prototype.add_known_ext = function(extension) {
  $(document).trigger('preference-change-in-progress');

  pref = ArrayPreference.find("user_extensions");
  pref.array.push(extension);
  pref.commit(application.controllers.editor, application.controllers.google_oauth.show_reauth).then(function() {
    $(document).trigger('preference-change-done');
  })
}
