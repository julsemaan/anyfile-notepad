function EditorController(view, options){
  ace.require("ace/ext/language_tools");
  this.editor_view = ace.edit("editor");
  this.editor_view.setOptions({
    enableBasicAutocompletion: true
  });
  
  this.$ = $('#'+view);
  this.$editor = this.$.find('#editor');
  this.file_id = options["file_id"];
  
  this.ajax_defered_waiting = {};
  this.safe_to_quit = true;
  
  this.content = null;
  this.content_saved = "";

  this.major_notice_pref = options["major_notice_pref"];

  this.file_explorer = options["file_explorer"];
  this.favorites_controller = options["favorites_controller"];
  this.recent_files_controller = options["recent_files_controller"];
  this.editor_model_bind_controller = options["editor_model_bind_controller"];

  this.menu_width_pref = options["menu_width_pref"];

  this.flash = options["flash"];

  this.models = {
    'extensions':new RestAdapter({model:Extension}),
    'mime_types':new RestAdapter({model:MimeType}),
    'syntaxes':new RestAdapter({model:Syntax}),
  }

  this.autosave_interval;

  this.realtime_collaborators = {};

  this.last_changed = new Date();
  //this.loop_check_last_changed();

  this.last_save_wanted = new Date();
}


EditorController.prototype.loop_check_last_changed = function() {
  var self = this;
  var inactiveMinutes = 60;
  var checkEverySeconds = 30;
  var inactiveRestartInterval = new Date((new Date()).getTime() - inactiveMinutes*60000);

  if(inactiveRestartInterval > self.last_changed) {
    console.log("User has been inactive for too long. Prompting restart of the app");

    new Popup({ 
      title: "Inactivity timeout", 
      confirm: true, 
      hb_partial: "#inactivity_restart", 
      confirm_btn: "Continue using app",
      cancel_btn: "Restart app",
      callback : function(result) {
        if(result) {
          clearInterval(window.inactivityRestartInterval);
          self.last_changed = new Date();
          self.loop_check_last_changed();
        }
        else {
          window.location.reload() 
        }
      },
    });
  }
  else {
    setTimeout(function(){self.loop_check_last_changed()}, checkEverySeconds * 1000);
  }
}

EditorController.prototype.initialize_html = function(){
  var self = this;

  var set_size_f = function() {
    self.$editor.css('top', self.$.find('#menu').height() + "px");
    $('#file_title_field').css('max-width', ($(window).width()-475) + "px");
  }
  set_size_f();
  $(window).resize(set_size_f);

  $('#file_title_field').keypress(function(e){ 
    if(e.which != 13) return true;

    self.$editor.focus();
    self.save();
    return false;
  });

  $(window).bind('beforeunload',function(){
    self.publish_realtime_event({'type':'leaved'});
    if(!self.safe_to_quit || (self.file && self.file.did_content_change()) ){
      return i18n("You have unsaved changes or your file is still being saved. You will lose your changes")
    }
  });

  $(window).on('keyup.ctrl-keys keydown.ctrl-keys', function(event){
    if(event.ctrlKey && !event.altKey && event.which != 17) {
      switch(String.fromCharCode(event.which).toLowerCase()) {
        case 'p':
          self.print();
        case 'c':
          return true;
        case 'x':
          return true;
        case 'v':
          return true;
        case 'o':
          self.editor_view.execCommand("startAutocomplete");
      }
      event.preventDefault();
      return false;
    }
  });

  if(!BooleanPreference.find('agree_terms').getValue()){
    $("#terms_modal").modal({'show':true,backdrop: true,backdrop: 'static', keyboard:false});
    $('.modal-backdrop.fade.in').css('opacity', '1.0')
    $('#agree_terms').click(function(){
      $("#terms_modal").modal('hide')
      BooleanPreference.find("agree_terms").refreshAndSet(true, self, self.show_reauth)
    })
    $('#disagree_terms').click(function(){
      window.location.href = "http://www.google.com"
    })
  }

  if(!BooleanPreference.find('agree_privacy').getValue()){
    $("#agree_privacy_modal").modal({'show':true,backdrop: true,backdrop: 'static', keyboard:false});
    $('.modal-backdrop.fade.in').css('opacity', '1.0')
    $('#agree_privacy').click(function(){
      $("#agree_privacy_modal").modal('hide')
      BooleanPreference.find("agree_privacy").refreshAndSet(true, self, self.show_reauth)
    })
  }

  if(self.major_notice_pref.getValue() < parseInt($('#major_notice_modal').attr('data-version')) ){
    $('#major_notice_modal').modal('show');
    $('.agree_major_notice').click(function(){
      $('#major_notice_modal').modal('hide'); 
      self.major_notice_pref.refreshAndSet(parseInt($('#major_notice_modal').attr('data-version')), self, self.show_reauth)
    })
  }

  // Calling this via setTimeout so that any error doesn't propagate to this call stack
  setTimeout(function() {
    self.setup_review_modal();
  }, 100);

  self.editor_view.on("change", function(){self.content_changed()});

  self.editor_view.getSession().selection.on('changeCursor', function(e){
    self.editor_model_bind_controller.set('line', self.editor_view.getSession().selection.getCursor().row);
    self.editor_model_bind_controller.set('column', self.editor_view.getSession().selection.getCursor().column);
  })
}

EditorController.prototype.setup_review_modal = function() {
  $('button.review_positive').click(function() {
    $('.leave_review_prompt').hide();
    $('div.review_positive').show();
  });

  $('button.review_negative').click(function() {
    $('.leave_review_prompt').hide();
    $('div.review_negative').show();
  });

  var startedDateStr = getCookie("started-date");
  var startedDate;
  if(startedDateStr) {
    startedDate = new Date(startedDateStr);
  }
  else {
    startedDate = new Date();
    setCookie("started-date", startedDate.toISOString());
  }

  var askedReviewDateStr = getCookie("asked-review-date");
  var askedReviewDate;
  if(askedReviewDateStr) {
    askedReviewDate = new Date(askedReviewDateStr);
  }

  var daysOfUsage = (new Date() - startedDate) / (24 * 60 * 60 * 1000);
  var daysSinceLastAsk = (new Date() - askedReviewDate) / (24 * 60 * 60 * 1000);

  // Don't ask under 7 days of usage
  if(daysOfUsage > 7) {
    // Only ask once every 90 days or ask the first time the minimum days of usage is exceeded
    if(Number.isNaN(daysSinceLastAsk) || daysSinceLastAsk > 90){
      $('#leave_review_modal').modal('show');
      askedReviewDate = new Date();
      setCookie("asked-review-date", askedReviewDate.toISOString());
    }
  }
}

EditorController.prototype.post_app_load = function(){
  var self = this
  this.$.find("#app_load_modal").modal('hide');
  this.$.find("#loading_overlay").fadeOut();
}

EditorController.prototype.file_object_from_provider = function(args){
  var self = this;
  switch(this.provider) {
    case "GoogleDrive":
      return new DriveFile(args);
      break;
    case "Dropbox":
      return new DropboxFile(args);
      break;
  }
}

EditorController.prototype.new = function(folder_id){
  var self = this;

  // we stop the collaboration if it's there
  this.stop_collaboration();

  var create_new = function() {
    // Should always be able to edit the title of a new file
    self.set_title_editable(true);

    self.flash.empty()
    self.file = self.file_object_from_provider({
      uid : "file",
      folder_id : folder_id,
    })
    self.post_file_load()
    self.preferences_controller.widgets.selectSyntax.setSyntaxMode(self.file.syntax.ace_js_mode);
  }

  if(this.provider == "Dropbox"){
    application.controllers.dropbox_oauth.test(create_new)
  }
  else {
    create_new();
  }

}

EditorController.prototype.set_title_editable = function(editable) {
  if(editable) {
    $('[data-bind-file="title"]').attr('contenteditable', 'true');
    $('[data-bind-file="title"]').removeAttr('disabled');
  } else {
    $('[data-bind-file="title"]').attr('disabled', 'disabled');
    $('[data-bind-file="title"]').removeAttr('contenteditable');
  }
}

EditorController.prototype.edit = function(id){
  var self = this
  this.flash.empty()
  this.$.find("#file_load_modal").modal('show');
  this.file_id = id
  // we stop the collaboration if it's there
  this.stop_collaboration();
  this.file = self.file_object_from_provider({
    id:id,
    uid : "file",
    loaded : function(error){
      self.$.find("#file_load_modal").modal('hide');
      if(!error){
        // Can't change filename with Dropbox
        if(self.provider == "Dropbox"){
          self.set_title_editable(false);
        }
        else {
          self.set_title_editable(true);
        }

        StatIncrement.record("file-edit."+self.provider);
        // NOTE: Extension already has a dot at the beginning
        StatIncrement.record("file-edit.extensions"+self.file.extension());

        self.post_file_load();
        self.recent_files_controller.add_file(self.file);
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
  this.editor_view.getSession().setValue(this.file.data, -1);

  // If its a saved file which isn't known to the app or to the user, then we warn him
  // Also the filename must not be equal to the extension (handling cases like .bashrc, .vimrc, etc)
  if(
      this.file.persisted && 
      this.file.title != this.file.extension() &&
      !extensions.find({ key: 'name', value: this.file.extension() }) &&
      !ArrayPreference.find("user_extensions").array.includes(this.file.extension())
      ){
    new Popup({ 
      title: "IMPORTANT NOTE, read closely!", 
      confirm: true, 
      hb_partial: "#unknown_encoding", 
      extension: this.file.extension(), 
      callback : function(result) {if(!result) window.location.hash = ""},
    });
    this.deactivate_autosave();
  }
  else {
    this.activate_autosave()
  }

  self.preferences_controller.widgets.selectSyntax.setSyntaxMode(self.file.syntax.ace_js_mode);
  this.allow_saving()

  if(this.file.persisted){
    this.flash.success(i18n("File '"+self.file.title+"' loaded"));
    document.title = this.file.title + " | Anyfile Notepad";
  }
  else{
    this.flash.success(i18n("Creating new file in "+self.provider));
    document.title = i18n("New file")+" | Anyfile Notepad";
  }

  self.top_menu.close_mobile_menu();

  if(self.provider == "GoogleDrive") {
    self.make_collaborative()
  }
}

EditorController.prototype.reset_options = function(){
  var self = this;
  this.allow_saving();
}

EditorController.prototype.print = function(){
  StatIncrement.record("file-print");
  var myWindow = window.open("", "MsgWindow", "width=800, height=600");
  var lines = this.editor_view.getValue().split('\n');
  for(var i in lines){
    lines[i] = (parseInt(i)+1)+". "+lines[i];
  }
  var numbered_text = lines.join('\n');
  $('#print_content .with_line_numbers').text(numbered_text);
  $('#print_content .without_line_numbers').text(this.editor_view.getValue());
  myWindow.document.write("<script src='https://code.jquery.com/jquery-1.11.3.min.js'></script>");
  myWindow.document.write($('#print_content').html());
}

EditorController.prototype.save = function(){
  var self = this;
  var save_time = new Date();
  self.last_save_wanted = save_time;
  self.saving_in_progress()

  if(this.file.title == ""){
      self.flash.error(i18n("Filename can't be empty"), 5);
      self.allow_saving()
      return false
  }

  if(!self.file.persisted) {
    new Popup({ 
      message : i18n("Your file is currently being saved, you will be redirected shortly."), 
      popup_id : 'file_being_saved',
      ok_btn : false,
    });
  }

  var length = this.editor_view.getValue().length
  self.editor_view.focus()

  // give a small time for everything to show.
  setTimeout(function(){
      self.file.update(true, function(response){
        if(response && !response.error) window.location.hash="#edit/"+self.provider+"/"+self.file.urlId();
        self.editor_view.focus();
        self.allow_saving();
        $("#file_being_saved").modal('hide');
        if(save_time < self.last_save_wanted) {
          console.log("User requested save after the process started, saving again");
          self.save();
        }
      })
  }, 500)
  return false;
}

EditorController.prototype.download = function(){
  var self = this;
	var filename = self.file.title;
	var blob = new Blob([self.file.data], {type: self.file.mime_type});
	if(window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveBlob(blob, filename);
	}
	else{
			var elem = window.document.createElement('a');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = filename;        
			document.body.appendChild(elem);
			elem.click();
			document.body.removeChild(elem);
	}
}

EditorController.prototype.activate_autosave = function(force){
  var self = this
  this.deactivate_autosave()
  if(force || BooleanPreference.find("autosave").getValue()) {
    self.autosave_enabled = true;
    $('.autosave-on').show();
    $('.autosave-off').hide();
    self.autosave_interval = setInterval(function(){self.autosave()}, 5000)
  }
}

EditorController.prototype.deactivate_autosave = function(){
  var self = this
  clearInterval(this.autosave_interval);
  self.autosave_enabled = false;
  $('.autosave-off').show();
  $('.autosave-on').hide();
}

EditorController.prototype.autosave = function(){
  var self = this;
  if(!this.file.title == "" && this.file.persisted && this.file.did_content_change()){
    if(!self.autosave_count) self.autosave_count = 0;
    self.autosave_count += 1;

    this.$.find('.editor_save_button').html(i18n("Saving")+"...")
    var new_revision = (self.autosave_count % 3 == 0) ? true : false;

    self.file.update(new_revision, function(response){
      self.reset_options()
      if(response && !response.error) window.location.hash="#edit/"+self.provider+"/"+self.file.urlId()
    })

  }
}

EditorController.prototype.setSyntaxMode = function(syntax) {
  var self = this;
  if(window.syntaxes){
    StatIncrement.record("setting-syntax-manually."+self.file.extension());
    this.file.syntax = syntaxes.find({key:'ace_js_mode', value:syntax})
    this.editor_view.getSession().setMode("ace/mode/"+syntax);
  }
  else {
    console.log("syntaxes aren't initialized...")
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

EditorController.prototype.event_is_kb_save = function(event) {
  var ctrlMeta = (event.metaKey || event.ctrlKey);
  return ( (String.fromCharCode(event.which).toLowerCase() == 's' && ctrlMeta) || event.which == 19 );
}

EditorController.prototype.saving_in_progress = function(){
  var self = this;
  this.$.find('.editor_save_button').html(i18n("Saving")+"...")
  this.$.find('.editor_save_button').unbind('click')
  this.safe_to_quit = false
  $(window).off('keydown.save')
  $(window).on('keydown.save', function(event) {
    if (!self.event_is_kb_save(event)) return true;
    self.last_save_wanted = new Date();
    event.preventDefault();
    return false;
  });  
  self.can_save = false;
}

EditorController.prototype.allow_saving = function(){
  var self = this;
  self.can_save = true
  this.$.find('.editor_save_button').html(i18n("Save"))
  this.$.find('.editor_save_button').click(function(){self.save()})
  this.safe_to_quit = true
  $(window).off('keydown.save')
  $(window).on('keydown.save', function(event) {
    if (!self.event_is_kb_save(event)) return true;
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

EditorController.prototype.content_changed = function(){
  var self = this;

  self.last_changed = new Date();

  this.file.set("data", this.editor_view.getValue());
  if(!this.file.persisted){
    this.$.find('.editor_save_button').html(i18n("Save"))
    return
  }

  if(!(this.$.find('.editor_save_button').html() == i18n("Saving")+"...")){
    if(this.file.did_content_change()){
      this.$.find('.editor_save_button').html(i18n("Save"))
    }
    else{
      this.$.find('.editor_save_button').html(i18n("Saved"))
    }
  }
}

EditorController.prototype.set_wait = function(key, value){
  var self = this;
  this.ajax_defered_waiting[key] = value
}

EditorController.prototype.init_collaboration = function(model){
  var self = this;
  try{
  var content = model.createString(self.file.data);
  model.getRoot().set("content", content);
  }catch(e){console.log("Error in collaboration init : "+e)}
}

EditorController.prototype.stop_collaboration = function(){
  var self = this;
  //Clear out the collaborators area      
  self.clear_collaborators();

  clearInterval(self.realtime_ping_interval);

  // remove any previous event listeners, if any
  if(self.realtime_document) self.realtime_document.stop_realtime();
  self.realtime_document = undefined;
}

EditorController.prototype.publish_realtime_event = function(e){
  var self = this;

  if(!self.realtime_document) return;

  //console.log("publishing event", e)

  e.google_user_id = application.controllers.google_oauth.current_user.user_id;
  e.google_user_name = application.controllers.google_oauth.current_user.name;
  self.realtime_document.publish_event(e).fail(function(){
    console.error("Error publishing realtime event, will retry in a second");
    setTimeout(function() {
      self.publish_realtime_event(e);
    }, 1000);
  });
}

EditorController.prototype.ping_realtime = function() {
  var self = this;
  self.publish_realtime_event({
    "type": "ping",
    "timestamp": new Date().getTime(), 
  });
}

EditorController.prototype.make_collaborative = function(){
  var self = this;

  self.stop_collaboration();

  if(!self.file.persisted) {
    return;
  }

  self.realtime_document = self.file;

  // Notify we've joined
  self.publish_realtime_event({
    "type":"joined",
  });

  // Make ourself visible every 10 seconds
  self.realtime_ping_interval = setInterval(function() {
    self.ping_realtime();
  }, 10 * 1000);

  self.editor_view.getSession().getDocument().on('change', function(e){
    if(!e.remote_change) {
      e.type = "ace.js";
      self.publish_realtime_event(e);
    }
  });

  self.realtime_document.start_realtime_events(function(e) {
    //console.log("receiving event", e)
    
    self.add_collaborator(e);

    if(e.category != self.realtime_document.collab_id) {
      console.log("Discarding event because its not meant for this document", e);
    }

    if(e.data.type == "ace.js") {
      e.data.remote_change = true;
      self.editor_view.getSession().getDocument().applyDelta(e.data);
    }
    else if(e.data.type == "joined") {
      console.log(e.data.type)
      self.last_joined_ping = self.last_joined_ping || 0;
      // Don't ping more than once per second
      var now = new Date().getTime();
      if(now - self.last_joined_ping > 1 * 1000) {
        console.log("Someone has joined the collaboration, making ourself visible");
        self.ping_realtime();
        self.last_joined_ping = now;
      }
      else {
        console.log("Not publishing ping due to rate limiting");
      }
    }
    else if(e.data.type == "leaved") {
      self.remove_collaborator(e);
    }
  });
}

EditorController.prototype.clear_collaborators = function(collaborator){
  var self = this;
  $('.collaborators').html('');
}

EditorController.prototype.remove_collaborator = function(e){
  var self = this;
  $('#collaborator-'+e.data.google_user_id).remove();
}

EditorController.prototype.add_collaborator = function(e) {
  var self = this;
  var data = e.data;
  if(application.controllers.google_oauth.current_user.user_id == data.google_user_id) return;

  if(!self.autosave_enabled && !self.file.warned_autosave_collab) {
    new Popup({ 
      message : i18n("Autosave isn't currently enabled and we detected you are collaborating with another user on this file. We suggest enabling autosave, otherwise unexpected issues may occur if the file isn't saved frequently enough."), 
      confirm_btn: i18n("Enable autosave temporarily"),
      cancel_btn: i18n("Continue without autosave"),
      callback : function(result) {if(result) self.activate_autosave(true)}, 
      confirm : true,
    });
    self.file.warned_autosave_collab = true;
  }

  var collaborator_id = data.google_user_id;
  self.realtime_collaborators[collaborator_id] = self.realtime_collaborators[collaborator_id] || {};
  var clearFunc = self.realtime_collaborators[collaborator_id].clearFunc;
  if(clearFunc) clearTimeout(clearFunc);
  
  // Set an interval to delete the collaborator if he's unseen for 2 minutes
  self.realtime_collaborators[collaborator_id].clearFunc = setTimeout(function() {
    console.log("Removing unseen collaborator", e.data.google_user_name);
    self.remove_collaborator(e); 
  }, 120 * 1000)

  var element = $("<span id='collaborator-"+data.google_user_id+"' class='label label-default' style='color:#041e47;background-color:"+niceRandomColor()+"'>"+data.google_user_name+"</span>");
  if(! $('.collaborators').has('#collaborator-'+data.google_user_id).length )
    $('.collaborators').append(element) ;

}

EditorController.prototype.reset_collaboration = function() {
  var self = this;
  if(self.provider == "GoogleDrive"){
    self.stop_collaboration();
    self.init_collaboration();
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

EditorController.prototype.open_share_modal = function() {
  var self = this;

  if(self.file.provider != "GoogleDrive") {
    new Popup({message : i18n("This feature is only available for Google Drive files.")});
    return;
  }

  if(self.file.persisted){
    application.controllers.google_oauth.share_client.setItemIds([self.file.id]);
    application.controllers.google_oauth.share_client.showSettingsDialog();
  }
  else {
    new Popup({message : i18n("You must save the file before you can share it.")});
  }
}

EditorController.prototype.restart_app = function() {
  var self = this;
  new Popup({ message : i18n("Are you sure ?"), callback : function(result) {if(result) window.location.reload()}, confirm : true});
}

EditorController.prototype.browser_check = function() {
  var self = this;
  var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
      // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
  var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
  var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
      // At least Safari 3+: "[object HTMLElementConstructor]"
  var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
  var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

  if(isIE) {
    self.flash.error(i18n("The browser you are using is completely untested with this app. Consider using another browser."));
  }
}

EditorController.prototype.select_locale = function(locale){
  var self = this;
  setCookie("locale", locale, 365)
  
  new Popup({ message : i18n("Requires to restart the application to be effective. Proceed with restart?"), callback : function(result) {if(result) window.location.reload()}, confirm : true });
}

