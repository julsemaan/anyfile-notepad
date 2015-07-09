function EditorController(view, options){
  this.editor_view = ace.edit("editor");
  this.$ = $('#'+view);
  this.$editor = $.find('#editor')
  this.file_id = options["file_id"];
  
  this.ajax_defered_waiting = {}
  this.skip_clearance = false;
  this.clearance_interval = null;
  this.safe_to_quit = true;
  
  this.content = null;
  this.content_saved = "";

  this.word_wrap_pref = options["word_wrap_pref"]
  this.font_size_pref = options["font_size_pref"]
  this.tab_size_pref = options["tab_size_pref"]
  this.saw_v2_notice_pref = options["saw_v2_notice_pref"]

  this.theme_pref = options["theme_pref"]

  this.file_explorer = options["file_explorer"]

  this.menu_width_pref = options["menu_width_pref"]

  this.keybinding_pref = options["keybinding_pref"]

  this.flash = options["flash"]

  this.models = {
    'extensions':new RestAdapter({model:Extension, suffix:'.json'}),
    'mime_types':new RestAdapter({model:MimeType, suffix:'.json'}),
    'syntaxes':new RestAdapter({model:Syntax, suffix:'.json'}),
  }

  this.auto_save_interval;

  this.initialize_html()
}

EditorController.prototype.initialize_html = function(){
  var self = this;

  this.$.find('#skip_clearance').click(function(){self.skip_clearance = true})

//  this.$.find(".font_size_button").click(function(){self.change_font_size($(this).attr('value'))})
//  this.$.find(".tab_size_button").click(function(){self.change_tab_size($(this).attr('value'))})
//  this.$.find(".keybinding_button").click(function(){self.change_keybinding($(this).attr('value'))})

  $('.word_wrap_checkbox').on('change', function(){
    self.change_word_wrap($(this).prop('checked'))
  });

  $('select').on('change', function() {
    if($(this).hasClass('keybinding_select')){
      self.change_keybinding(this.value);
    }
    else if($(this).hasClass('tab_size_select')){
      self.change_tab_size(this.value);
    }
    else if($(this).hasClass('font_size_select')){
      self.change_font_size(this.value);
    }
  });

  this.$.find(".show_file_info").click(function(){
    self.$.find('#file_info_modal').modal('show')
  })

  $(window).bind('beforeunload',function(){
    if(!self.safe_to_quit || (self.file && self.file.did_content_change()) ){
      return "You have unsaved changes or your file is still being saved. You will lose your changes"
    }
    if(!self.is_ready_to_submit() && !self.skip_clearance){
      self.clearance_interval = setInterval(function(){self.wait_for_clearance(function(){location.reload()})}, 1000)
      return "Some of your preferences are still being saved. Press 'Don't reload' to wait for them to be saved.";
    }
  });

  if(this.font_size_pref.getValue() != null){
    this.editor_view.setFontSize(this.font_size_pref.getValue())
  }

  if(this.tab_size_pref.getValue() != null){
    this.editor_view.getSession().setTabSize(this.tab_size_pref.getValue())
  }

  this.change_keybinding(this.keybinding_pref.getValue())

  this.editor_view.getSession().setUseWrapMode(this.word_wrap_pref.getValue())

/*
  window.addEventListener("keydown",function (e) {
    if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) { 
      e.preventDefault();
      self.open_search()
    }
  })
*/

  $(window).on('keydown.search', function(event) {
    if (!( String.fromCharCode(event.which).toLowerCase() == 'f' && event.shiftKey && event.ctrlKey) && !(event.which == 19)) return true;
    self.open_search()
    event.preventDefault();
    return false;
  });  



  this.initial_theme = "ace/theme/clouds_midnight"
  if(this.theme_pref.getValue()){
    this.initial_theme = this.theme_pref.getValue()
  }
  setInterval(function(){self.set_background_color_from_theme()}, 500)
  this.editor_view.setTheme(this.initial_theme)
  this.set_background_color_from_theme()
  $("."+escape_jquery_selector("theme_"+this.initial_theme)).addClass("btn-primary")

  this.$.find('#go_reauth').click(function(){self.skip_clearance = true;window.location.reload();})
  this.$.find('#cancel_reauth').click(function(){
    self.$.find('#reauthenticate_modal').modal('hide')
  })


  if(!Preference.find('agree_terms', BooleanPreference).getValue()){
    $("#terms_modal").modal({'show':true,backdrop: true,backdrop: 'static', keyboard:false});
    $('.modal-backdrop.fade.in').css('opacity', '1.0')
    $('#agree_terms').click(function(){
      $("#terms_modal").modal('hide')
      Preference.find("agree_terms", BooleanPreference).setValue(true, self, self.show_reauth)
    })
    $('#disagree_terms').click(function(){
      window.location.href = "http://www.google.com"
    })
  }

}



EditorController.prototype.post_app_load = function(){
  var self = this
  this.$.find("#app_load_modal").modal('hide');
  this.$.find("#loading_overlay").fadeOut();
}

EditorController.prototype.new = function(folder_id){
  var self = this
  this.flash.empty()
  this.file = new DriveFile(undefined, {
    uid : "file",
    folder_id : folder_id,
  })
  self.post_file_load()

  this.set_syntax_mode(this.file.syntax.ace_js_mode, false);
}

EditorController.prototype.edit = function(id){
  var self = this
  this.flash.empty()
  this.$.find("#file_load_modal").modal('show');
  this.file_id = id
  this.file = new DriveFile(id, {
    uid : "file",
    loaded : function(error){
      self.$.find("#file_load_modal").modal('hide');
      if(!error){
        self.make_collaborative()
        self.post_file_load()
      }
      else{
        self.new("root")
        self.flash.error(error)
      }
    }
  })
}

EditorController.prototype.post_file_load = function(){
  var self = this;
  if(unescape(encodeURIComponent(self.file.data)) != this.file.data){
    this.flash.warning("This file has an unknown encoding to this app.<br/>Some characters may be corrupted and the file may lose parts of it's encoding when saved.<br/>Until you change something your file is safe.")
  }
  this.editor_view.getSession().setValue(this.file.data, -1)

  this.file.data = this.editor_view.getSession().getValue()
  this.file.data_saved = this.editor_view.getSession().getValue()

  this.set_syntax_mode(this.file.syntax.ace_js_mode, false);
  this.allow_saving()
  clearInterval(this.check_content_changed_interval)
  this.check_content_changed_interval = setInterval(function(){self.check_content_changed()}, 100)
  this.activate_auto_save()

  if(this.file.persisted){
    this.flash.success("File loaded", 3)
    document.title = this.file.title + " | Anyfile Notepad";
  }
  else{
    this.flash.success("Creating new file")
    document.title = "New file | Anyfile Notepad";
  }
}

EditorController.prototype.reset_options = function(){
  var self = this;
  this.skip_clearance = false;
  this.allow_saving();
}

EditorController.prototype.print = function(){
  var form = document.createElement("form");
  form.setAttribute("method", "post");
  form.setAttribute("action", "/app/print");

  form.setAttribute("target", "view");

  var hiddenField = document.createElement("input"); 
  hiddenField.setAttribute("type", "hidden");
  hiddenField.setAttribute("name", "content");
  hiddenField.setAttribute("value", this.file.data);
  form.appendChild(hiddenField);

  hiddenField = document.createElement("input"); 
  hiddenField.setAttribute("type", "hidden");
  hiddenField.setAttribute("name", "title");
  hiddenField.setAttribute("value", this.file.title);
  form.appendChild(hiddenField);

  document.body.appendChild(form);

  window.open('', 'view');

  form.submit();
}

EditorController.prototype.save = function(){
  var self = this;
  var length = this.editor_view.getValue().length
  self.editor_view.focus()
  if(this.file.title == ""){
      this.flash.error("File title can't be empty", 5);
      return false
  }
  else{
    //this.file.title = this.$.find("#g_file_title").val()
    this.file.set("data", this.editor_view.getValue())

    this.block_saving()
    // give a small time for everything to show.
    setTimeout(function(){
        self.file.update(true, function(response){
          self.reset_options()
          if(response && !response.error) window.location.hash="#edit/"+self.file.id
          self.editor_view.focus();
        })
    }, 500)
  }
  return false;
}

EditorController.prototype.activate_auto_save = function(){
  var self = this
  this.deactivate_auto_save()
  self.auto_save_interval = setInterval(function(){self.auto_save()}, 5000)
}

EditorController.prototype.deactivate_auto_save = function(){
  var self = this
  clearInterval(this.auto_save_interval)
}

EditorController.prototype.auto_save = function(){
  var self = this;
  if(!this.file.title == "" && this.file.persisted){
    this.file.set("data", this.editor_view.getValue())

    this.block_saving()

    self.file.update(false, function(response){
      self.reset_options()
      if(response && !response.error) window.location.hash="#edit/"+self.file.id
    })

  }
}

EditorController.prototype.set_syntax_mode = function(syntax,save){
  var self = this;
  save = save || false
  this.$.find('.syntax_button').css("background-color", "initial")
  this.$.find('.syntax_'+syntax).css("background-color", "#009688")
  console.log('.syntax_'+syntax)
  this.file.syntax = syntaxes.find({key:'ace_js_mode', value:syntax})
  this.editor_view.getSession().setMode("ace/mode/"+syntax);
  if(this.file_id != "" && save){
    Preference.find("syntaxes["+self.file.extension()+"]", StringPreference).setValue(syntax, self, self.show_reauth)
  }
}

EditorController.prototype.is_ready_to_submit = function(){
  var self = this;
  for(key in this.ajax_defered_waiting){
    if(this.ajax_defered_waiting[key]){
      return false
    }
  }
  return true
}

EditorController.prototype.wait_for_clearance = function(){
  var self = this;
  if(this.is_ready_to_submit() || this.skip_clearance){
    clearInterval(this.clearance_interval)
    this.$.find('#clearance_wait_modal').modal('hide')
  }
  else{
    this.$.find('#clearance_wait_modal').modal('show')
  }
}

EditorController.prototype.change_font_size = function(font_size){
  var self = this;

  this.font_size_pref.setValue(font_size, self, function(){self.show_reauth()})
  this.editor_view.setFontSize(this.font_size_pref.getValue())
}

EditorController.prototype.change_tab_size = function(tab_size){
  var self = this;

  this.tab_size_pref.setValue(tab_size, self, self.show_reauth)

  this.editor_view.getSession().setTabSize(this.tab_size_pref.getValue())
}

EditorController.prototype.block_saving = function(){
  var self = this;
  this.$.find('.editor_save_button').html("Saving...")
  this.$.find('.editor_save_button').unbind('click')
  this.safe_to_quit = false
  $(window).off('keydown.save')
  $(window).on('keydown.save', function(event) {
    if (!( String.fromCharCode(event.which).toLowerCase() == 's' && event.ctrlKey) && !(event.which == 19)) return true;
    self.flash.warning("This file is already being saved. Calm down.", 3)
    event.preventDefault();
    return false;
  });  
}

EditorController.prototype.allow_saving = function(){
  var self = this;
  this.$.find('.editor_save_button').html("Saved")
  this.$.find('.editor_save_button').click(function(){self.save()})
  this.safe_to_quit = true
  $(window).off('keydown.save')
  $(window).on('keydown.save', function(event) {
    if (!( String.fromCharCode(event.which).toLowerCase() == 's' && event.ctrlKey) && !(event.which == 19)) return true;
    self.save()
    event.preventDefault();
    return false;
  });
}

EditorController.prototype.show_file_explorer = function(){
  var self = this;
  this.open_menu()
  this.open_explorer()
}

EditorController.prototype.check_content_changed = function(){
  var self = this;
  //this.file.title = this.$.find("#g_file_title").val()
  if(this.file.persisted){
    this.realtime_content.setText(this.editor_view.getValue());
  }
  this.file.set("data", this.editor_view.getValue())
  if(this.file.did_content_change()){
    if(!(this.$.find('.editor_save_button').html() == "Saving...")){
      this.$.find('.editor_save_button').html("Save")
    }
  }
  else{
    this.$.find('.editor_save_button').html("Saved")
  }
}

EditorController.prototype.set_wait = function(key, value){
  var self = this;
  this.ajax_defered_waiting[key] = value
}

EditorController.prototype.change_word_wrap = function(value){
  var self = this;

  this.word_wrap_pref.setValue(value, self, function(){self.show_reauth()});
  this.editor_view.getSession().setUseWrapMode(this.word_wrap_pref.getValue())
}


EditorController.prototype.open_search = function(){
  var self = this;
  this.editor_view.execCommand('find')
}

EditorController.prototype.open_replace = function(){
  var self = this;
  this.editor_view.execCommand('replace') 
}

EditorController.prototype.select_theme = function(name){
  var self = this;
  var current_theme = this.theme_pref.getValue()
  if(!this.theme_pref.getValue()){
    current_theme = this.initial_theme
  }
  $("."+escape_jquery_selector("theme_"+current_theme)).removeClass("btn-primary")

  this.theme_pref.setValue(name, self, self.show_reauth)

  this.editor_view.setTheme(this.theme_pref.getValue())
  this.set_background_color_from_theme()
  var check = this.$.find('#theme_check').detach()
  $("."+escape_jquery_selector("theme_"+name)).addClass("btn-primary")
  
}
   
EditorController.prototype.set_background_color_from_theme = function(){
  var self = this;
  html_element = document.getElementsByTagName("html")[0]
  $(html_element).css('background-color', this.$.find('.ace_gutter').css('background-color'))
  body_element = document.getElementsByTagName("body")[0]
  $(body_element).css('background-color', this.$.find('.ace_gutter').css('background-color'))
}

EditorController.prototype.vim_command_handler = function(command){
  var self = this;
  if(command == "/"){
    this.open_search()
  }
}

EditorController.prototype.change_keybinding = function(keybinding){
  var self = this;
  if(keybinding == "vim"){
    this.editor_view.setKeyboardHandler("ace/keyboard/vim");
    if(!this.editor_view.showCommandLine){
      this.editor_view.showCommandLine = function(command){self.vim_command_handler(command)}
      // we bind the vim write event to this controller
      ace.config.loadModule("ace/keyboard/vim", function(m) {
          var VimApi = require("ace/keyboard/vim").CodeMirror.Vim
          VimApi.defineEx("write", "w", function(cm, input) {
              self.save()
          })
      })
    }
  }
  else if(keybinding == "emacs"){
    this.editor_view.setKeyboardHandler("ace/keyboard/emacs");
  }
  else{
    this.editor_view.setKeyboardHandler();
  }

  Preference.find("keybinding", BooleanPreference).setValue(keybinding, self, self.show_reauth)
}


EditorController.prototype.init_collaboration = function(model){
  var self = this;
  try{
  var content = model.createString(self.file.data);
  model.getRoot().set("content", content);
  }catch(e){console.log(e)}
}

EditorController.prototype.make_collaborative = function(){
  var self = this;

  // remove any previous event listeners, if any
  if(self.realtime_content){
    self.realtime_content.removeAllEventListeners();
  }

  gapi.drive.realtime.load(self.file.id, function(doc){
    self.realtime_document = doc;
    try{
    self.realtime_content = self.realtime_document.getModel().getRoot().get("content");


    self.realtime_content.addEventListener(
      gapi.drive.realtime.EventType.TEXT_INSERTED, 
      function(evt){
        self.file_content_added(evt)
      });
    
    self.realtime_content.addEventListener(
      gapi.drive.realtime.EventType.TEXT_DELETED, 
      function(evt){
        self.file_content_deleted(evt)
      });

    self.realtime_document.addEventListener(
      gapi.drive.realtime.EventType.COLLABORATOR_JOINED, 
      function(evt){
        self.add_collaborator(evt.collaborator);
      });

    self.realtime_document.addEventListener(
      gapi.drive.realtime.EventType.COLLABORATOR_LEFT, 
      function(evt){
        self.remove_collaborator(evt.collaborator);
      });
    
    self.display_collaborators()

    }catch(e){console.log(e)}
  }, 
  function(model) {self.init_collaboration(model)},
  function(error) {
    if(error.type == "token_refresh_required"){
      oauth_controller.do_auth();
    }
  }
  );
}

EditorController.prototype.remove_collaborator = function(collaborator){
  var self = this;
  self.clear_realtime_user(collaborator.userId);
  $('#collaborator-'+collaborator.userId).remove();
}

EditorController.prototype.add_collaborator = function(collaborator) {
  var self = this;
  if(collaborator.isMe) return;
  var element = $("<span id='collaborator-"+collaborator.userId+"' class='label label-default' style='background-color:"+collaborator.color+"'>"+collaborator.displayName+"</span>");
  self.collaborators_colors[collaborator.userId] = collaborator.color;
  $('.collaborators').append(element);

}

EditorController.prototype.display_collaborators = function(){
  var self = this;
  var collaborators = self.realtime_document.getCollaborators();
  self.collaborators_colors = {}
  for(var i in collaborators) {
    var collaborator = collaborators[i];
    self.add_collaborator(collaborator);
  }
}

EditorController.prototype.file_content_added = function(evt){
  var self = this;
  if(!evt.isLocal){
    var start = self.editor_view.getSession().getDocument().indexToPosition(evt.index)
    self.editor_view.getSession().insert(start, evt.text)
    var nl_stripped = evt.text.replace('\n', '')
    if(nl_stripped !== "") {
      self.move_realtime_user(evt.userId, self.editor_view.getSession().getDocument().indexToPosition(evt.index+1));
    }
 }
  
}

EditorController.prototype.file_content_deleted = function(evt){
  var self = this;
  if(!evt.isLocal){
    var begin = self.editor_view.getSession().getDocument().indexToPosition(evt.index)
    var end = self.editor_view.getSession().getDocument().indexToPosition(evt.index+evt.text.length)
    var range = new Range(begin.row, begin.column, end.row, end.column)
    self.editor_view.getSession().remove({start:begin, end:end})

    var nl_stripped = evt.text.replace('\n', '')
    if(nl_stripped !== "") {
      self.move_realtime_user(evt.userId, self.editor_view.getSession().getDocument().indexToPosition(evt.index));
    }
  }
  
}

EditorController.prototype.move_realtime_user = function(userId, position){
  var self = this;
  self.clear_realtime_user(userId);
  self.editor_view.getSession().addGutterDecoration(position.row, userId+'-active')
  setTimeout(function(){
  $('.'+userId+'-active').css('background-color', self.collaborators_colors[userId]);
  }, 100);
}

EditorController.prototype.clear_realtime_user = function(userId){
  var self = this;
  $('.'+userId+'-active').css('background-color', '');
  for(var i=0; i<self.editor_view.getSession().getDocument().getLength();i++){
      self.editor_view.getSession().removeGutterDecoration(i, userId+'-active');
  }
}

EditorController.prototype.options_show_callback = function() {
  var self = this;
  $("select").each(function(){
    if($(this).hasClass('keybinding_select')) {
      $(this).val(Preference.find("keybinding", StringPreference).getValue())
    }
    else if($(this).hasClass('tab_size_select')){
      $(this).val(Preference.find("ace_js_tab_size", StringPreference).getValue())
    }
    else if($(this).hasClass('font_size_select')){
      $(this).val(Preference.find("ace_js_font_size", StringPreference).getValue())
    }
  });
  
  if(Preference.find("word_wrap", BooleanPreference).getValue()){
    $('.word_wrap_checkbox').attr('checked', 'checked');
  }
  else{
    $('.word_wrap_checkbox').removeAttr('checked');
  }

}

EditorController.prototype.show_file_info = function() {
  var self = this;
  self.$.find('#file_info_modal').modal('show')
}

EditorController.prototype.restart_app = function() {
  var self = this;
  if(confirm("Are you sure ?")) window.location.reload()
}
