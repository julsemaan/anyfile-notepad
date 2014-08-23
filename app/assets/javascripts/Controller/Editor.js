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

  this.EDITOR_W_MENU_METRICS = {top:"0", bottom:"0", left:"280px", right:"130px"}
  this.EDITOR_FULL_METRICS = {top:"0", bottom:"0", left:"30px", right:"130px"}
  this.metrics = null;

  this.word_wrap_pref = options["word_wrap_pref"]
  this.show_minimized = options["show_minimized"]
  this.font_size_pref = options["font_size_pref"]
  this.tab_size_pref = options["tab_size_pref"]
  this.MAX_FILE_SIZE = options["MAX_FILE_SIZE"]

  this.current_theme = options["current_theme"]

  this.file_explorer = options["file_explorer"]

  this.menu_width_pref = options["menu_width_pref"]

  this.models = {
    'extensions':new RestAdapter({model:Extension, suffix:'.json'}),
    'mime_types':new RestAdapter({model:MimeType, suffix:'.json'}),
    'syntaxes':new RestAdapter({model:Syntax, suffix:'.json'}),
  }

  this.initialize_html()
}

EditorController.prototype.initialize_html = function(){
  var self = this;

  this.$.find('#skip_clearance').click(function(){self.skip_clearance = true})

  this.$.find(".syntax_button").click(function(){self.set_syntax_mode($(this).attr('mode'))})
  this.$.find(".font_size_button").click(function(){self.change_font_size($(this).attr('value'))})
  this.$.find(".tab_size_button").click(function(){self.change_tab_size($(this).attr('value'))})

  this.$.find(".show_file_info").click(function(){
    self.$.find('#file_info_modal').modal('show')
  })

  if(this.show_minimized){
    this.minimize_menu()
    this.metrics = this.EDITOR_FULL_METRICS
  }
  else{
    this.metrics = this.EDITOR_W_MENU_METRICS
  }

  this.activate_menu_resizing()

  $.each( this.metrics , function( prop, value ) {
    self.$.find('#editor').css(prop,value)
  });



  $(window).bind('beforeunload',function(){
    if(!self.safe_to_quit || self.file.did_content_change()){
      return "You have unsaved changes or your file is still being saved. You will lose your changes"
    }
    if(!self.is_ready_to_submit() && !self.skip_clearance){
      self.clearance_interval = setInterval(function(){self.wait_for_clearance(function(){location.reload()})}, 1000)
      return "Some of your preferences are still being saved. Press 'Don't reload' to wait for them to be saved.";
    }
  });

  if(this.font_size_pref.getValue() != null){
    this.editor_view.setFontSize(this.font_size_pref.getValue())
  
    this.$.find('#font_check').show()
    var check = this.$.find('#font_check').detach()
    //refactor!!
    $(document.getElementById("font_"+this.font_size_pref.getValue())).prepend(check)
  }

  if(this.tab_size_pref.getValue() != null){
    this.editor_view.getSession().setTabSize(this.tab_size_pref.getValue())
    this.$.find('#tab_check').show()
    var check = this.$.find('#tab_check').detach()
    //refactor!!
    $(document.getElementById("tab_"+this.tab_size_pref.getValue())).append(check)
  }

  this.editor_view.getSession().setUseWrapMode(this.word_wrap_pref.getValue())
  if(this.word_wrap_pref.getValue()){
    this.$.find('#word_wrap_check').show()
  }

  if(this.file_explorer.cached){
    this.$.find('#cache_file_explorer_check').show()
  }

  window.addEventListener("keydown",function (e) {
    if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) { 
      e.preventDefault();
      editor_view.execCommand("find")
    }
  })

  setInterval(function(){self.set_background_color_from_theme()}, 500)
  this.editor_view.setTheme(this.current_theme)
  this.set_background_color_from_theme()
  $(document.getElementById("theme_"+this.current_theme)).addClass("btn-primary")

  this.$.find('#go_reauth').click(function(){self.skip_clearance = true;window.location.reload();})
  this.$.find('#cancel_reauth').click(function(){
    self.$.find('#reauthenticate_modal').modal('hide')
  })
  setInterval(function(){self.keep_alive()}, 300000)

}



EditorController.prototype.post_app_load = function(){
  var self = this
  this.$.find("#app_load_modal").modal('hide');
}

EditorController.prototype.new = function(){
  var self = this
  this.file = new DriveFile(undefined, {
    uid : "file",
  })
  self.post_file_load()

  this.set_syntax_mode(this.file.syntax.ace_js_mode, false);
}

EditorController.prototype.edit = function(id){
  var self = this
  this.$.find("#file_load_modal").modal('show');
  this.file_id = id
  this.file = new DriveFile(id, {
    uid : "file",
    loaded : function(){
      self.install_observers()
      self.post_file_load()
      self.$.find("#file_load_modal").modal('hide');
    }
  })
}

EditorController.prototype.post_file_load = function(){
  var self = this;
  this.editor_view.getSession().setValue(this.file.data, -1)
  this.set_syntax_mode(this.file.syntax.ace_js_mode, false);
  this.allow_saving()
  setInterval(function(){self.check_content_changed()}, 100)
}

EditorController.prototype.reset_options = function(){
  var self = this;
  this.skip_clearance = false;
  this.allow_saving();
}

EditorController.prototype.save = function(){
  var self = this;
  var length = this.editor_view.getValue().length
  if (length > this.MAX_FILE_SIZE){
      alert("File won't be saved. Sorry :( our infrastructure is not badass enough for files that big.")
    }
    else{
      //this.file.title = this.$.find("#g_file_title").val()
      this.file.set("data", this.editor_view.getValue())

      this.block_saving()
      this.$.find('#file_save_modal').modal('show')
      this.file.update(this.$.find("#g_file_new_revision").prop('checked'), function(){
        self.$.find("#file_save_modal").modal("hide")
        self.reset_options()
        self.editor_view.focus()
        window.location.hash="#edit/"+self.file.id
      })
    }
  return false;
}

EditorController.prototype.set_syntax_mode = function(syntax,save){
  var self = this;
  save = save || false
  var check = this.$.find('#syntax_check').detach();
  this.$.find('#syntax_'+syntax).prepend(check)
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
  this.$.find('#font_check').show()
  var check = this.$.find('#font_check').detach()

  //refactor
  $(document.getElementById("font_"+this.font_size_pref.getValue())).prepend(check)

}

EditorController.prototype.change_tab_size = function(tab_size){
  var self = this;

  this.tab_size_pref.setValue(tab_size, self, self.show_reauth)

  this.editor_view.getSession().setTabSize(this.tab_size_pref.getValue())

  this.$.find('#tab_check').show()
  var check = this.$.find('#tab_check').detach()
  //refactor
  $(document.getElementById("tab_"+this.tab_size_pref.getValue())).append(check)

}

EditorController.prototype.block_saving = function(){
  var self = this;
  this.$.find('.editor_save_button').html("Saving...")
  this.$.find('.editor_save_button').unbind('click')
  this.safe_to_quit = false
  $(window).off('keydown.save')
  $(window).on('keydown.stop_save', function(event) {
    if (!( String.fromCharCode(event.which).toLowerCase() == 's' && event.ctrlKey) && !(event.which == 19)) return true;
    //alert("This file is already being saved. Calm down.")
    event.preventDefault();
    return false;
  });  
}

EditorController.prototype.allow_saving = function(){
  var self = this;
  this.$.find('.editor_save_button').html("Save")
  this.$.find('.editor_save_button').click(function(){self.save()})
  this.safe_to_quit = true
  $(window).off('keydown.stop_save')
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
  this.file.set("data", this.editor_view.getValue())
  if(this.file.did_content_change()){
    this.$.find('.editor_save_button').addClass('btn-warning')
  }
  else{
    this.$.find('.editor_save_button').removeClass('btn-warning')
  }
}

EditorController.prototype.minimize_menu = function(save_pref){
  var self = this;
  save_pref = typeof save_pref !== 'undefined' ? save_pref : false;
  this.$.find('#editor_menu_container').fadeOut(function(){
    self.$.find('#editor_menu_container').hide(
      function(){self.$.find('#editor').animate(self.EDITOR_FULL_METRICS, function(){
        self.editor_view.resize()   
        self.$.find('.small_g_file_menu').fadeIn(function(){
        if(save_pref){
          self.prefers_menu_opened(false)
        }
        })
      })
      })  
    });
}

EditorController.prototype.maximize_menu = function(save_pref){
  var self = this;
  save_pref = typeof save_pref !== 'undefined' ? save_pref : false;
  this.$.find('.small_g_file_menu').fadeOut()
  this.$.find('#editor').animate(this.EDITOR_W_MENU_METRICS,function(){
    self.editor_view.resize()  
    self.$.find('#editor_menu_container').fadeIn(function(){
      if(save_pref){
        self.prefers_menu_opened(true)
      }
    })
  })
}

EditorController.prototype.prefers_menu_opened = function(opened){
  var self = this;
  var prefers_minimized = opened ? "false" : "true"
  Preference.find('prefers_minimized', StringPreference).setValue(prefers_minimized, self, self.show_reauth)
}

EditorController.prototype.set_wait = function(key, value){
  var self = this;
  this.ajax_defered_waiting[key] = value
}

EditorController.prototype.toggle_word_wrap = function(){
  var self = this;

  this.word_wrap_pref.setValue(!this.word_wrap_pref.getValue(), self, function(){self.show_reauth()});
  this.editor_view.getSession().setUseWrapMode(this.word_wrap_pref.getValue())
  if(this.word_wrap_pref.getValue()){
    this.$.find('#word_wrap_check').show()
  }
  else{
    this.$.find('#word_wrap_check').hide()
  }
}

EditorController.prototype.toggle_cache_file_explorer = function(){
  var self = this;
  this.file_explorer.cached = !this.file_explorer.cached;
  if(this.file_explorer.cached && this.file_explorer.cache()){
    this.$.find('#cache_file_explorer_check').show()
  }
  else{
    this.$.find('#cache_file_explorer_check').hide()
  }

  Preference.find('cache_file_explorer_enabled', BooleanPreference).setValue(this.file_explorer.cached, self, self.show_reauth)
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
  this.ajax_defered_waiting["select_theme"] = true
  $(document.getElementById("theme_"+this.current_theme)).removeClass("btn-primary")
  this.current_theme = name
  this.editor_view.setTheme(this.current_theme)
  this.set_background_color_from_theme()
  var check = this.$.find('#theme_check').detach()
  $(document.getElementById("theme_"+name)).addClass("btn-primary")
  
  $.ajax(
  {
    url: '/preferences/get_update?theme='+name, 
    statusCode: {
      403: function(data){
        self.ajax_defered_waiting['select_theme'] = false
        self.show_reauth()
      },
      200: function(data){
        self.ajax_defered_waiting['select_theme'] = false
      }
    }
  })
}
   
EditorController.prototype.set_background_color_from_theme = function(){
  var self = this;
  html_element = document.getElementsByTagName("html")[0]
  $(html_element).css('background-color', this.$.find('.ace_gutter').css('background-color'))
  body_element = document.getElementsByTagName("body")[0]
  $(body_element).css('background-color', this.$.find('.ace_gutter').css('background-color'))
}

EditorController.prototype.activate_menu_resizing = function(){
  var self = this;
  this.set_menu_width_from_pref()
  this.$.find("#editor_menu_container").resizable({
    handles : "e",
    minWidth : 280,
    maxWidth : 500,
  })
  this.$.find("#editor_menu_container").resize(function(){self.resize_menu()})
  this.$.find("#editor_menu_container").resize(debouncer(function(){self.save_menu_width_pref()}, 1000))
}

EditorController.prototype.set_menu_width_from_pref = function(){
  var self = this;
  this.$.find("#editor_menu_container").width(this.menu_width_pref.getValue())
  this.current_menu_width = this.$.find("#editor_menu_container").width()
  this.$.find('#editor').css("left", this.menu_width_pref.getValue())
  this.EDITOR_W_MENU_METRICS["left"] = this.menu_width_pref.getValue() 
}

EditorController.prototype.resize_menu = function(){
  var self = this;
  var width_modification = this.$.find("#editor_menu_container").outerWidth() - this.current_menu_width
  var new_left = parseInt(this.$.find("#editor").css("left")) + width_modification + "px"
  this.$.find('#editor').css("left", new_left)
  this.EDITOR_W_MENU_METRICS["left"] = new_left
  this.current_menu_width = this.$.find("#editor_menu_container").outerWidth()
}

EditorController.prototype.save_menu_width_pref = function(){
  var self = this;
  this.menu_width_pref.setValue(this.$.find('#editor_menu_container').width()+"px", self, self.show_reauth)
}

EditorController.prototype.show_reauth = function(){
  var self = this;
  this.oauth_controller.show_reauth();
}

EditorController.prototype.keep_alive = function(){
  var self = this;
  $.ajax(
  {
    url: '/g_oauth/keep_alive', 
    statusCode: {
      403: function(data){
        self.show_reauth()
      },
      200: function(data){
      }
    }
  })
}
