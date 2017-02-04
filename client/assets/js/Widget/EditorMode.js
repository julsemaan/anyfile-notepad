Class("EditorModeWidget", ["PreferenceWidget"]);

EditorModeWidget.prototype.preference = function() {
  return StringPreference.find('keybinding'); 
}

EditorModeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  var keybinding = self.preference().getValue();
  if(keybinding == "vim"){
    application.controllers.editor.editor_view.setKeyboardHandler("ace/keyboard/vim");
    if(!application.controllers.editor.editor_view.showCommandLine){
      // we bind the vim write event to this controller
      ace.config.loadModule("ace/keyboard/vim", function(m) {
          var VimApi = require("ace/keyboard/vim").CodeMirror.Vim
          VimApi.defineEx("write", "w", function(cm, input) {
              application.controllers.editor.save()
          })
      })
    }
  }
  else if(keybinding == "emacs"){
    application.controllers.editor.editor_view.setKeyboardHandler("ace/keyboard/emacs");
  }
  else{
    application.controllers.editor.editor_view.setKeyboardHandler();
  }

}



