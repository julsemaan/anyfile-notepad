Class("DropboxFile", ["CloudFile"]);

DropboxFile.prototype.init = function(options) {
  CloudFile.prototype.init.call(this, options);
  this.oauth_controller = dropbox_oauth_controller;
  this.client = this.oauth_controller.client;
}

DropboxFile.prototype.get_file_data = function(){
  var self = this;

  this.oauth_controller.do_auth(function(){
    var r = new DropboxRequest({
      auth_handler:self.oauth_controller,
      client:self.client,
      request : function(){
        var request = this;
        this.client.stat(self.id, function(e,r){request.handle_response(e,r)})
      },
      success : function(response){self.handle_metadata_response(response)},
    })
    r.request();
  })

}

DropboxFile.prototype.handle_metadata_response = function(response) {
  var self = this;
  self.set("mimeType", response.mimeType);
  self.set("title", response.name);
  self.set("title_saved", response.name);

  this.oauth_controller.do_auth(function(){
    var r = new DropboxRequest({
      auth_handler:self.oauth_controller,
      client:self.client,
      request : function(){
        var request = this;
        this.client.readFile(self.id, function(e,r){request.handle_response(e,r)})
      },
      success : function(response){
          self.set("data", response)
          self.set("data_saved", self.data)
          self.compute_syntax()
          self.loaded()
      },
    })
    r.request();
  })
}

DropboxFile.prototype.update_metadata = function(callback) { callback() }

DropboxFile.prototype.update_data = function(new_revision, callback){
  var self = this;
  this.set("_tmp_title_saved", this.title)
  this.set("_tmp_data_saved", this.data)

  this.oauth_controller.do_auth(function(){
    var r = new DropboxRequest({
      auth_handler:self.oauth_controller,
      client:self.client,
      request : function(){
        var request = this;
        this.client.writeFile(self.title, self.data, function(e,r){request.handle_response(e,r)})
      },
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
    r.request();
  })
}
