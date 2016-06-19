function GoogleOAuthController(options){
  var self = this;
  this.client_id = "249464630588-ombbls22arnr75jdl4uprsof9t9rrp42.apps.googleusercontent.com";
  this.drive_app_id = "249464630588";
  this.scopes = options["scopes"]
  this.authed = false
  this.current_user = undefined
  //this.init()
  this.queue = [];
}

GoogleOAuthController.prototype.init = function(){
  var self = this;
  setTimeout(function(){self.check_authed()}, 15000)
  this.add_to_queue(function(){
    User.current_user(function(user){self.current_user = user})
  })
  this.do_auth();
}

GoogleOAuthController.prototype.authorize_params = function(to_add) {
  var self = this;
  var base = {
    client_id: self.client_id,
    scope: self.scopes,
  };

  if(User.get_session_user_id()){
    base["user_id"] = User.get_session_user_id();
    base["authuser"] = -1;
  }

  for (var attrname in to_add) { base[attrname] = to_add[attrname]; }

  return base;
}

GoogleOAuthController.prototype.do_auth = function(){
  var self = this
  gapi.auth.authorize(self.authorize_params({immediate : true}), function(auth_result){
    if(auth_result["error"] != "immediate_failed"){
      self.post_auth(auth_result)
    }
    else{
      $('#auth_modal').modal('show')
      $('#start_g_oauth').click(function(){
        self.auth_popup()
      })
    }
  
  });


}

GoogleOAuthController.prototype.auth_popup = function(){
  var self = this
  //Do it without the immediate
  gapi.auth.authorize(self.authorize_params(), function(auth_result_without_immediate){self.post_auth(auth_result_without_immediate)})
}

GoogleOAuthController.prototype.auth_with_user = function(user_id, callback){
  var self = this;
  gapi.auth.authorize(self.authorize_params({authuser: -1, user_id : user_id}), function(auth_result){
    editor_controller.reset_collaboration();
    User.current_user(function(){
      self.post_auth(auth_result);
      callback();
    });
  });
}

GoogleOAuthController.prototype.switch_user = function() {
  var self = this;
  var previous_user = self.current_user;
  self.auth_with_user(undefined, function(){
    if(self.current_user.user_id != previous_user.user_id){
      $('#app_restart_modal').modal('show'); 
      window.location.hash = '#new' ; 
      window.location.reload()
    }
    else {
      new Popup({message : i18n("User was not changed. Remember you can add accounts via the 'Add Account' button so they are available in the app.")});
    }
  })
}

GoogleOAuthController.prototype.post_auth = function(auth_result){
  var self = this;
  if (auth_result && !auth_result.error) {
    setCookie('access_token', auth_result['access_token'], 1)
    gapi.load('auth:client,drive-realtime,drive-share', function(){
      gapi.client.load('oauth2', 'v2', function() {
        gapi.client.load('drive', 'v2', function(){
          self.share_client = new gapi.drive.share.ShareClient(self.drive_app_id);
          self.share_client.setOAuthToken(auth_result['access_token']);
          self.ready()
        })
      });
    });
    
    $('#auth_modal').modal('hide')
    //cool it worked
  }
  else{
    this.auth_failed();
  }
}

GoogleOAuthController.prototype.ready = function(){
  var self = this;
  this.authed = true
  for(var i=0; i < this.queue.length; i++){
    this.queue[i]()
  } 
  this.queue = []
}

GoogleOAuthController.prototype.add_to_queue = function(to_do){
  var self = this;
  this.queue.push(to_do)
}

GoogleOAuthController.prototype.show_reauth = function(){
  $('#reauthenticate_modal').modal('show')
}

GoogleOAuthController.prototype.auth_failed = function(){
  //$('#auth_failed_modal').modal('show')

}

GoogleOAuthController.prototype.check_authed = function(){
  if(!this.authed){
    this.auth_failed()
  }
}

GoogleOAuthController.prototype.execute_request = function(request, callback){
  var self = this
  request.execute(function(response){
    if(!response.error){
      callback(response)
    }
    else if(response.error.code == 401 || response.error.code == 403){
      self.queue.push(function(){self.execute_request(request, callback)})
      self.authed = false
      self.do_auth()
    }
    else if(response.error.code == 409){
      console.log("There's that weird 409 error that just occured. We won't take care of it as it's completely unclear what it means and it works anyway. Thanks Google....")
      callback(response);
    }
    else{
      $('#error_modal .additionnal_message').html(i18n("We got this message from Google")+" : "+ response.error.message)
      $('#error_modal').modal('show')
      callback(response)
    }
  });
}

Class("DropboxOAuthController", ["Model"]);

DropboxOAuthController.prototype.init = function(options){
  Model.call(this, options);
  this.client = new Dropbox.Client({ key: "ps6cmsgenf8ypox" });
  this.client.authDriver(new Dropbox.AuthDriver.Redirect);
}

DropboxOAuthController.prototype.do_auth = function(callback){
  this.client.authenticate(function(error, client){
    callback(error,client);
  });
}

DropboxOAuthController.prototype.test = function(callback){
  var self = this;
  self.do_auth(function(){
    var r = new DropboxRequest({
      auth_handler:self,
      client:self.client,
      request : function(){
        var request = this;
        this.client.getAccountInfo(function(e,r){request.handle_response(e,r)})
      },
      success : function(response){
        callback(true);
      },
    })
    r.request();
  })
}

Class("DropboxRequest", ["Model"]);

DropboxRequest.prototype.init = function(options){
  Model.call(this, options);
}

DropboxRequest.prototype.handle_response = function(error, response, additionnal_info){
  var self = this;
  if(error){
    if(error.status == 401){
      self.client.reset();
      self.auth_handler.do_auth(function(){self.request()});
    }
    else {
      $('#error_modal .additionnal_message').html(i18n("We got this message from Dropbox")+" : "+ JSON.stringify(error.response.error))
      $('#error_modal').modal('show')
    }
  }

  self.success(response, additionnal_info);
}

