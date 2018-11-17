Class("CloudFile", ["Model"])

CloudFile.prototype.post_init = function(options){
  var self = this;

  this.set("title", "")
  this.set("title_saved", "")
  this.set("data", "")
  this.set("data_saved", "")
  this.set("_tmp_title_saved", "")
  this.set("_tmp_data_saved", "")
  this.set("_post_update_callback")

  this.set("_publisher_uuid", guid());
  this.set("_run_realtime", false);

  this.post_init_child(options);

  if(this.id){
    this.persisted = true
    this.get_file_data()
  }
  else{
    this.compute_syntax() 
  }
}

CloudFile.file_extension = function(filename){
  try{
    return "."+filename.split('.').pop();
  }catch(e){return ""}
}

CloudFile.prototype.extension = function(){
  return CloudFile.file_extension(this.title)
}

// Checks if the file contains a line to override the syntax
// Line should be something like:
// afn:syntax=javascript
CloudFile.prototype.syntax_from_file_line = function() {
  var self = this;
  var data = self.data;

  lines = data.split("\n");

  for(var i in lines) {
    var line = lines[i];
    match = line.match(/afn:syntax=(.*)/);

    if(match) {
      return syntaxes.find({key:'ace_js_mode', value:match[1]});
    }
  }

  return;
} 

CloudFile.prototype.compute_syntax = function(){
  var self = this
  if(this.fuck_syntax) return;

  // First, attempt to see if the file content overrides the syntax
  var syntax = self.syntax_from_file_line();
  if(syntax) {
    self.set('syntax', syntax);
    return self.get('syntax');
  }

  syntax_pref = StringPreference.find('syntaxes['+this.extension()+']')
  find_syntax: if(syntax_pref && !syntax_pref.is_empty()){
    syntax = syntaxes.find({key:'ace_js_mode', value:syntax_pref.getValue()});
    if(syntax){
      self.set('syntax', syntax)
      return self.get('syntax')
    }
  }
  else{
    var extension = extensions.find({key:'name', value:this.extension()})
    if(extension){
      self.set('syntax', syntaxes.find({value:extension.syntax_id}))
      return self.get('syntax')
    }
    else{
      if(self.get('mime_type') == "text/plain") break find_syntax;
      mime_type = mime_types.find({key:'type_name', value:self.get('mime_type')});
      if(!mime_type) break find_syntax;
      extension = extensions.find({key:'mime_type_id', value:mime_type.id});
      if(extension){
        self.set('syntax', syntaxes.find({value:extension.syntax_id}));
        return self.get('syntax'); 
      }
    }
  }
  self.set('syntax', syntaxes.find({key:'ace_js_mode', value:'plain_text'}))
  return self.get('syntax')
}

CloudFile.prototype.check_for_unknown_mime_type = function(mime_type){
  var self = this
  try {
    var mime_type_obj = mime_types.find({key:'type_name', value:mime_type})
    if(!mime_type_obj){
      //notify_unknown_mime_type(mime_type)
    }
  } catch(e){
    // do nothing. It's not the end of the world
  }
}

CloudFile.prototype.mime_type_from_extension = function (){
  var self = this
  try{
    extension = extensions.find({key:'name', value:self.extension()})
    mime_type = mime_types.find({key:'id', value:extension.mime_type_id})
    return mime_type.type_name
  } 
  catch(e){
    return "text/plain"
  }
}

CloudFile.prototype.update = function(new_revision, callback) {
  var self = this;
  StatIncrement.record("file-update."+self.constructor.name);
  this._post_update_callback = callback
  if (this.did_content_change() || new_revision){
    self.update_data(new_revision, callback)
  }
  else{
    callback()
  }

}


CloudFile.prototype.did_content_change = function(){
  var self = this;
  return (this.data != this.data_saved || this.title != this.title_saved)
}

CloudFile.prototype.delete = function(){
  var self = this;
  var request = gapi.client.drive.files.delete({
    'fileId': this.id
  });
  application.controllers.google_oauth.execute_request(request, function(response){
  })
}

CloudFile.prototype.urlId = function(){
  return this.id;
}

CloudFile.prototype.generate_collab_id = function() {
  return guid();
}

CloudFile.prototype.publish_event = function(e) {
  var self = this;
  e.publisher_uuid = self._publisher_uuid;
  return $.post(
    AFN_VARS["collab_uri"] + "/api/collaboration/realtime_events/"+self.collab_id,
    JSON.stringify(e),
  );
}

CloudFile.prototype.events_since = function(since) {
  var self = this;
  var args = {
    category: self.collab_id,
    timeout: 30,
  };

  if(since) {
    args["since_time"] = since;
  }

  return $.get(
    AFN_VARS["collab_uri"] + "/api/collaboration/realtime_events",
    args,
  );
}

CloudFile.prototype.get_realtime_events = function(start_at, callback) {
  var self = this;

  self.events_since(start_at)
    .success(function(data){
      if(self._run_realtime) {
        var events = data["events"] || [];
        if(events.length > 0) {
          for(var i in events) {
            var e = events[i];
            if(e.data.publisher_uuid != self._publisher_uuid) {
              callback(e);
            }
          }
        }
        self.get_realtime_events(data.timestamp, callback);
      }
    })
    .fail(function(data){
      if(self._run_realtime) {
        console.log("Failed to obtain events for realtime collaboration");
        self.get_realtime_events(start_at, callback);
      }
    });
}

CloudFile.prototype.start_realtime_events = function(callback) {
  var self = this;
  self._run_realtime = true;
  self.get_realtime_events(self.modified_timestamp, callback);
}

CloudFile.prototype.stop_realtime = function() {
  self._run_realtime = false;  
}
