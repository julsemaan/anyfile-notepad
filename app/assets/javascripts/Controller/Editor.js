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

  this.syntax_mode = options["syntax_mode"]
  this.file_extension = options["file_extension"]
  this.word_wrap_enabled = options["word_wrap_enabled"]
  this.cache_file_explorer_enabled = options["cache_file_explorer_enabled"]
  this.show_minimized = options["show_minimized"]
  this.font_size = options["font_size"]
  this.tab_size = options["tab_size"]
  this.MAX_FILE_SIZE = options["MAX_FILE_SIZE"]
  
  this.initialize_html()
}

EditorController.prototype.initialize_html = function(){
   var self = this;
   this.$.find('#skip_clearance').click(function(){skip_clearance = true})

   this.$.find(".syntax_button").click(function(){self.set_ace_mode($(this).attr('mode'))})
   this.$.find(".font_size_button").click(function(){self.change_font_size($(this).attr('value'))})
   this.$.find(".tab_size_button").click(function(){self.change_tab_size($(this).attr('value'))})

   this.$.find(".show_file_info").click(function(){
     self.$.find('#file_info_modal').modal('show')
   })

   this.allow_saving()
   this.remember_content()
   setInterval(function(){self.check_content_changed()}, 1000)

   if(this.show_minimized){
     this.metrics = this.EDITOR_FULL_METRICS
   }
   else{
     this.metrics = this.EDITOR_W_MENU_METRICS
   }

   $.each( this.metrics , function( prop, value ) {
     self.$.find('#editor').css(prop,value)
   });

   this.editor_view.getSession().setMode("ace/mode/"+this.syntax_mode);


   $(window).bind('beforeunload',function(){
     if(!self.safe_to_quit || self.editor_view.getValue() != self.content_saved){
       return "You have unsaved changes or your file is still being saved. You will lose your changes"
     }
     if(!self.ready_to_submit() && !self.skip_clearance){
       self.clearance_interval = setInterval(function(){self.wait_for_clearance(function(){location.reload()})}, 1000)
       return "Some of your preferences are still being saved. Press 'Don't reload' to wait for them to be saved.";
     }
   });

   if(this.font_size != null){
     this.editor_view.setFontSize(this.font_size)
   
     this.$.find('#font_check').show()
     var check = this.$.find('#font_check').detach()
     //refactor!!
     $(document.getElementById("font_"+this.font_size)).prepend(check)
   }

   if(this.tab_size != null){
     this.editor_view.getSession().setTabSize(this.tab_size)
     this.$.find('#tab_check').show()
     var check = this.$.find('#tab_check').detach()
     //refactor!!
     $(document.getElementById("tab_"+this.tab_size)).append(check)
   }

   this.editor_view.getSession().setUseWrapMode(this.word_wrap_enabled)
   if(this.word_wrap_enabled){
     this.$.find('#word_wrap_check').show()
   }

   if(this.cache_file_explorer_enabled){
     this.$.find('#cache_file_explorer_check').show()
   }

   window.addEventListener("keydown",function (e) {
     if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) { 
       e.preventDefault();
       editor_view.execCommand("find")
     }
   })

}

EditorController.prototype.reset_options = function(){
  var self = this;
  this.skip_clearance = false;
  this.allow_saving();
}

EditorController.prototype.save = function(){
  var self = this;
  var length = editor_view.getValue().length
  if (length > this.MAX_FILE_SIZE){
      alert("File won't be saved. Sorry :( our infrastructure is not badass enough for files that big.")
    }
    else{
      if(this.ready_to_submit() || this.skip_clearance){
        this.block_saving()
        this.remember_content()
        this.$.find('#g_file_content').val(editor.getValue())
        this.$.find('.editor_form').submit()
        this.$.find('#file_save_modal').modal('show')
      }
      else{
        var self = this;
        this.wait_for_clearance(self.validate_file_size_and_submit)
        clearance_interval = setInterval(function(){self.wait_for_clearance(self.validate_file_size_and_submit)}, 1000)
      }
    }
  return false;
}

EditorController.prototype.set_syntax_mode = function(syntax){
  var self = this;
  var check = this.$.find('#syntax_check').detach();
  this.$.find('#syntax_'+mode).prepend(check)
  editor_view.getSession().setMode("ace/mode/"+syntax);
  if(this.file_id != ""){
    this.ajax_defered_waiting['set_ace_mode'] = true
    $.ajax(
      {
        url: '/preferences/get_update?syntaxes'+this.file_extension+'='+syntax,
        statusCode: {
          403: function(data){
            self.ajax_defered_waiting['set_ace_mode'] = false
            self.show_reauth()
          },
          200: function(data){
            self.ajax_defered_waiting['set_ace_mode'] = false
          }
        }	
      }
    )
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

EditorController.prototype.show_wait_for_clearance = function(){
  var self = this;
  if(this.ready_to_submit() || this.skip_clearance){
    clearInterval(this.clearance_interval)
    this.$.find('#clearance_wait_modal').modal('hide')
    //after()
  }
  else{
    this.$.find('#clearance_wait_modal').modal('show')
  }
}

EditorController.prototype.change_font_size = function(font_size){
  var self = this;
  this.ajax_defered_waiting['change_font_size'] = true
  this.editor_view.setFontSize(font_size)
  this.$.find('#font_check').show()
  var check = this.$.find('#font_check').detach()
  //refactor
  $(document.getElementById("font_"+font_size)).prepend(check)

  $.ajax(
    {
      url: '/preferences/get_update?ace_js_font_size='+font_size,
      statusCode: {
        403: function(data){
          self.ajax_defered_waiting['change_font_size'] = false
          this.show_reauth()
        },
        200: function(data){
          self.ajax_defered_waiting['change_font_size'] = false
        }
      }
    })
}

EditorController.prototype.change_tab_size = function(tab_size){
  var self = this;
  this.ajax_defered_waiting['change_tab_size'] = true 
  editor_view.getSession().setTabSize(tab_size)

  this.$.find('#tab_check').show()
  var check = this.$.find('#tab_check').detach()
  //refactor
  $(document.getElementById("tab_"+tab_size)).append(check)

  $.ajax(
    {
      url: '/preferences/get_update?ace_js_tab_size='+tab_size,
      statusCode: {
        403: function(data){
          self.ajax_defered_waiting['change_tab_size'] = false
          this.show_reauth()
        },
        200: function(data){
          self.ajax_defered_waiting['change_tab_size'] = false
        }
      }
    })      
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
  this.$.find('.editor_save_button').click(this.save)
  this.safe_to_quit = true
  $(window).off('keydown.stop_save')
  $(window).on('keydown.save', function(event) {
    if (!( String.fromCharCode(event.which).toLowerCase() == 's' && event.ctrlKey) && !(event.which == 19)) return true;
    this.save()
    event.preventDefault();
    return false;
  });
}

EditorController.prototype.show_file_explorer = function(){
  var self = this;
  this.open_menu()
  this.open_explorer()
}

EditorController.prototype.remember_content = function(){
  var self = this;
  this.content_saved = this.editor_view.getValue()
}

EditorController.prototype.check_content_changed = function(){
  var self = this;
  if(this.editor_view.getValue() != this.content_saved){
    this.$.find('.editor_save_button').addClass('btn-warning')
  }
  else{
    this.$.find('.editor_save_button').removeClass('btn-warning')
  }
}

EditorController.prototype.minimize_menu = function(save_pref){
  var self = this;
  save_pref = typeof save_pref !== 'undefined' ? save_pref : false;
  this.$.find('.g_file_menu').fadeOut(function(){
    self.$.find('.g_file_menu').hide(
      function(){self.$.find('#editor').animate(self.EDITOR_FULL_METRICS, function(){
        self.editor_view.resize()   
        self$.find('.small_g_file_menu').fadeIn(function(){
        if(save_pref){
          this.prefers_menu_opened(false)
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
    self.$.find('.g_file_menu').fadeIn(function(){
      if(save_pref){
        self.prefers_menu_open(true)
      }
    })
  })
}

EditorController.prototype.prefers_menu_opened = function(opened){
  var self = this;
  this.ajax_defered_waiting['send_prefers_opened'] = true 
  var prefers_minimized;
  if(opened){
    prefers_minimized = "false"
  }
  else{
    prefers_minimized = "true"
  }
  $.ajax(
    {
      url: '/preferences/get_update?prefers_minimized='+prefers_minimized, 
      statusCode: {
        403: function(data){
          self.ajax_defered_waiting['send_prefers_opened'] = false
          this.show_reauth()
        },
        200: function(data){
          self.ajax_defered_waiting['send_prefers_opened'] = false
        }
      }
    })
}

EditorController.prototype.toggle_word_wrap = function(){
  var self = this;
  this.ajax_defered_waiting['toggle_word_wrap'] = true;
  this.word_wrap_enabled = !this.word_wrap_enabled;
  this.editor_view.getSession().setUseWrapMode(this.word_wrap_enabled)
  if(this.word_wrap_enabled){
    this.$.find('#word_wrap_check').show()
  }
  else{
    this.$.find('#word_wrap_check').hide()
  }
  $.ajax(
    {
      url: '/preferences/get_update?word_wrap='+this.word_wrap_enabled, 
      statusCode: {
        403: function(data){
          self.ajax_defered_waiting['toggle_word_wrap'] = false
          this.show_reauth()
        },
        200: function(data){
          self.ajax_defered_waiting['toggle_word_wrap'] = false
        }
      }
    })
}

EditorController.prototype.toggle_cache_file_explorer = function(){
  var self = this;
  this.ajax_defered_waiting['toggle_cache_file_explorer'] = true;
  this.cache_file_explorer_enabled = !this.cache_file_explorer_enabled;
  if(this.cache_file_explorer_enabled && this.cache_explorer()){
    this.$.find('#cache_file_explorer_check').show()
  }
  else{
    this.$.find('#cache_file_explorer_check').hide()
    this.cache_file_explorer_enabled = false;
  }
  $.ajax(
    {
      url: '/preferences/get_update?cache_file_explorer_enabled='+cache_file_explorer_enabled, 
      statusCode: {
        403: function(data){
          self.ajax_defered_waiting['toggle_cache_file_explorer'] = false
          this.show_reauth()
        },
        200: function(data){
          self.ajax_defered_waiting['toggle_cache_file_explorer'] = false
        }
      }
    })
}

EditorController.prototype.open_search = function(){
  var self = this;
  this.editor_view.execCommand('find')
}

EditorController.prototype.open_replace = function(){
  var self = this;
  this.editor_view.execCommand('replace') 
}
