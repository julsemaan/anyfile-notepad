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

CloudFile.prototype.compute_syntax = function(){
  var self = this
  if(this.fuck_syntax) return

  syntax_pref = StringPreference.find('syntaxes['+this.extension()+']')
  find_syntax: if(syntax_pref && !syntax_pref.is_empty()){
    var syntax = syntaxes.find({key:'ace_js_mode', value:syntax_pref.getValue()});
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
