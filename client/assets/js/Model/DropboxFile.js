Class("DropboxFile", ["CloudFile"]);

DropboxFile.prototype.post_init_child = function(options) {
  this.cleanupId();

  this.set("provider", "Dropbox");
  this.oauth_controller = application.controllers.dropbox_oauth;
  this.client = this.oauth_controller.client;
}

DropboxFile.prototype.get_file_data = function(){
  var self = this;

  var r = new DropboxRequest({
    auth_handler:self.oauth_controller,
    client:self.client,
    request : self.client.filesGetMetadata({path:self.id}),
    success : function(response){self.handle_metadata_response(response)},
  });
  r.perform();

}

DropboxFile.prototype.handle_metadata_response = function(response) {
  var self = this;

  self.set("mime_type", response.mimeType);
  self.set("title", self.id);
  self.set("folder_id", self.id.split("/").slice(0,-1).join("/"));
  self.set("title_saved", response.name);
  
  var r = new DropboxRequest({
    auth_handler:self.oauth_controller,
    client:self.client,
    request : self.client.filesDownload({path:self.id}),
    success : function(response){
      var reader = new FileReader();
      reader.onload = function(e) {
        var text = e.target.result;
        self.set("data", text)
        self.set("data_saved", self.data)
        self.compute_syntax()
        self.loaded()
      };
      reader.readAsText(response.fileBlob);
    }
  })
  r.perform();
}

DropboxFile.prototype.update_metadata = function(callback) { callback() }

DropboxFile.prototype.update_data = function(new_revision, callback){
  var self = this;
  
  this.set("id", this.title);
  this.cleanupId();
  this.set("title", this.id);

  this.set("_tmp_title_saved", this.title)
  this.set("_tmp_data_saved", this.data)

  var r = new DropboxRequest({
    auth_handler:self.oauth_controller,
    client:self.client,
    request : self.client.filesUpload({path:self.id, contents:self.data, mode: {'.tag':'overwrite'}}),
    success : function(response){
      //set id if it's not persisted and set persisted
      if(!self.persisted){
        self.set("persisted", true)
        self.set("id", self.title)
      }
      self.set("title_saved", self._tmp_title_saved)
      self.set("data_saved", self._tmp_data_saved)
      callback({error:false})
    },
  })
  r.perform();
}

DropboxFile.prototype.cleanupId = function() {
  if(this.id && this.id[0] != "/") {
    this.id = "/" + this.id;
  }
}

DropboxFile.prototype.urlId = function(){
  return this.id.substr(1);
}
