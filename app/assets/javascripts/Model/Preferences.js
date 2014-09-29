function Preferences(loaded){
  this.PREFERENCES = {
    'prefers_minimized' : 'false',
    'ace_js_font_size' : "1em", 
    'ace_js_tab_size' : '4',
    'theme' : '',
    'word_wrap' : 'false',
    'cache_file_explorer_enabled' : 'false',
    'file_explorer_height' : "300px", 
    'menu_width' : '280px',
    'saw_v2_notice' : 'false',
  }
  
  this.HASH_PREFERENCES = [
    'syntaxes'
  ]

  this.ready = false 
  this.loaded = loaded || function(){}
  this.get_from_drive()
}

Preferences.prototype.create_initial = function(){
  this.prefs_file = new DriveFile(undefined, {
    uid: "preferences",
    folder_id: "appfolder",
    fuck_syntax: true
  })
  this.prefs_file.set('title', 'preferences');
  this.prefs_file.set('data', '{}');
  this.prefs_file.update_data();
  this.post_load()
}

Preferences.prototype.get_from_drive = function(){
  var self = this
  var request = gapi.client.drive.files.list({
    'q': '\'appfolder\' in parents'
  });

  oauth_controller.execute_request(request, function(response){
    var files = response.items
    if(!files){
      self.create_initial()
      return;
    }
    for(var i=0; i<files.length;i++){
      if(files[i].title == "preferences"){
        self.prefs_file = new DriveFile(files[i].id, {
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
  this.ready = true
  this.get_hash()
  this.loaded()
}

Preferences.prototype.get_hash = function(){
  if(!this.ready){
    throw "Preferences not loaded yet"
  }
  try{
  this.preferences = JSON.parse(this.prefs_file.data)
  }catch(e){
    alert("Your preferences were detected as corrupted.\nWe'll reset them to default.\nPlease file a bug report explaning how it happened on our community")
    this.set_hash({})
    this.commit()
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

Preferences.prototype.commit = function(callback){
  this.prefs_file.update(true, callback);
}
