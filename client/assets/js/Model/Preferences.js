function Preferences(loaded){
  this.PREFERENCES = {
    'prefers_minimized' : 'false',
    'ace_js_font_size' : "1em", 
    'ace_js_tab_size' : '4',
    'theme' : 'ace/theme/github',
    'word_wrap' : 'false',
    'cache_file_explorer_enabled' : 'false',
    'file_explorer_height' : "300px", 
    'major_notice' : '4',
    'agree_terms' : 'false',
    'keybinding' : 'normal',
    'favorites' : "[]",
    'autosave' : 'true',
    'show_all_characters' : 'false',
    'show_print_margin' : 'true',
    'tabs_as_spaces' : 'true',
    'recent_files': "[]",
  }
  
  this.HASH_PREFERENCES = [
    'syntaxes'
  ]

  this.ready = false 
  this.loaded = loaded || function(){}
  this.get_from_drive()
}

Preferences.prototype.create_initial = function(){
  this.new_prefs_file = new DriveFile({
    uid: "preferences",
    folder_id: "appfolder",
    fuck_syntax: true
  })
  console.log("creating initial preferences");
  this.new_prefs_file.set('title', 'preferences');
  this.new_prefs_file.set('data', '{}');
  this.post_load()
}

Preferences.prototype.get_from_drive = function(){
  var self = this
  var request = gapi.client.drive.files.list({
    'q': '\'appfolder\' in parents'
  });

  application.controllers.google_oauth.execute_request(request, function(response){
    var files = response.items
    if(!files){
      self.create_initial()
      return;
    }
    for(var i=0; i<files.length;i++){
      if(files[i].title == "preferences"){
        self.new_prefs_file = new DriveFile({
          id:files[i].id, 
          uid:"preferences",
          loaded: function(){
            self.post_load()
          },
          fuck_syntax:true
        }) 
        return
      }
    }
    self.create_initial()
  }) 
}

Preferences.prototype.post_load = function(){
  this.ready = true;
  this.prefs_file = this.new_prefs_file;
  this.get_hash();
  this.loaded();
}

Preferences.prototype.get_hash = function(){
  if(!this.ready){
    throw "Preferences not loaded yet"
  }
  try{
    this.preferences = JSON.parse(this.prefs_file.data)
  }catch(e){
    console.log(this.prefs_file.data)
    console.log(e)
    if(!this.warned){
      new Popup({ message : i18n("Your preferences could not be loaded. This is likely due to a Google server error. Please try restarting the app and file a bug if it persists.") });
      this.warned = true;
    }
    // we replace the commit method by a warning
    this.commit = function(){
      new Popup({ message : i18n("Can't commit your preferences because they weren't loaded properly. It is advised to restart the app.") });
    }
    this.set_hash({})
  }
  this.validate_defaults()
  this.prefs_file.data = JSON.stringify(this.preferences)
  return this.preferences
}

Preferences.prototype.set_hash = function(hash){
  this.preferences = hash
  this.prefs_file.data = JSON.stringify(this.preferences)
}

Preferences.prototype.validate_defaults = function(){
  for(var key in this.PREFERENCES){
    if(!this.preferences.hasOwnProperty(key) ){
      this.preferences[key] = this.PREFERENCES[key]
    }
  }

  for(var i in this.HASH_PREFERENCES){
    if(!(this.HASH_PREFERENCES[i] in this.preferences) ){
      this.preferences[this.HASH_PREFERENCES[i]] = {}
    } 
  }
}

Preferences.prototype.refresh = function(callback){
  this.loaded = callback;
  this.get_from_drive();
}

Preferences.prototype.reset = function(){
  this.set_hash({});
  this.commit();
}

Preferences.prototype.commit = function(callback){
  this.prefs_file.update(true, callback);
}
