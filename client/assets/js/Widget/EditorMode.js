Class("EditorModeWidget", ["PreferenceWidget"]);

EditorModeWidget.prototype.preference = function() {
  return StringPreference.find('keybinding'); 
}

EditorModeWidget.prototype.refreshFromPreferenceChild = function() {
  var self = this;
  var keybinding = self.preference().getValue();
  if(keybinding == "vim"){
    self.editor_controller.editor_view.setKeyboardHandler("ace/keyboard/vim");
    if(!self.editor_controller.editor_view.showCommandLine){
      // we bind the vim write event to this controller
      ace.config.loadModule("ace/keyboard/vim", function(m) {
          var VimApi = require("ace/keyboard/vim").CodeMirror.Vim
          VimApi.defineEx("write", "w", function(cm, input) {
              self.editor_controller.save()
          })
      })
    }
  }
  else if(keybinding == "emacs"){
    self.editor_controller.editor_view.setKeyboardHandler("ace/keyboard/emacs");
  }
  else{
    self.editor_controller.editor_view.setKeyboardHandler();
  }

}



