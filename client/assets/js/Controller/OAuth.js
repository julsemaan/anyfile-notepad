function GoogleOAuthController(options){
  var self = this;
  this.client_id = AFN_VARS['google_client_id'];
  this.drive_app_id = AFN_VARS['drive_app_id'];
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
    application.controllers.editor.reset_collaboration();
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
  this.client = new Dropbox({ clientId: AFN_VARS['dropbox_key']});
  
  // Attempt to restore the token from the cookie
  this.client.setAccessToken(getCookie("dropbox_access_token"));

  //TODO: change this to window.location
  this.auth_url = this.client.getAuthenticationUrl('http://localhost:8000/app.html');
}

DropboxOAuthController.prototype.do_auth = function(){

  // If this is in the URL, we're currently setting the token
  if(window.location.hash.match("^#access_token=")) {
    return
  }

  window.location = this.auth_url;
}

DropboxOAuthController.prototype.setTokenFromUrl = function() {
  var self = this;
  var token = parseQueryString(window.location.hash).access_token;
  self.client.setAccessToken(token);
  setCookie("dropbox_access_token", token);
}

DropboxOAuthController.prototype.test = function(callback){
  var self = this;

  if(!self.client.accessToken) {
    self.do_auth();
  }

  callback(true);
}

Class("DropboxRequest", ["Model"]);

DropboxRequest.prototype.init = function(options){
  Model.call(this, options);

  var self = this;
  self.todo = function() {
    self.request.then(function(response){
      self.handle_success(response)
    }).catch(function(error){
      self.handle_error(error)
    }); 
  }
}

DropboxRequest.prototype.perform = function() {
  var self = this;
  if(self.skip_test) {
    self.todo();
  }
  else {
    self.auth_handler.test(self.todo);
  }
}

DropboxRequest.prototype.handle_error = function(error){
  var self = this;
  console.log("this is an error", error)
  if(error.status == 401){
    $('#error_modal .additionnal_message').html(i18n("Your Dropbox authentication has expired. You will be redirected to the Dropbox website to reauthenticate. Your work will NOT BE SAVED. If you have important changes that aren't saved, cancel out this prompt and backup your changes."))
    $('#error_modal').modal('show');
    self.auth_handler.do_auth();
  }
  else {
    $('#error_modal .additionnal_message').html(i18n("We got this message from Dropbox")+" : "+ JSON.stringify(error.response.body.error_summary))
    $('#error_modal').modal('show')
  }
}

DropboxRequest.prototype.handle_success = function(response){
  var self = this;
  self.success(response);
}

