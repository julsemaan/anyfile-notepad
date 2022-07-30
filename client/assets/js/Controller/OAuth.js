function GoogleOAuthController(options){
  var self = this;
  this.client_id = AFN_VARS['google_client_id'];
  this.drive_app_id = AFN_VARS['drive_app_id'];
  this.scopes = options["scopes"]
  this.authed = false
  this.current_user = undefined
  this.client = undefined;
  //this.init()
  this.queue = [];
}

GoogleOAuthController.prototype.init = function(){
  var self = this;
  setTimeout(function(){self.check_authed()}, 15000)
  this.add_to_queue(function(){
    User.current_user(function(user){self.current_user = user});
  });
  this.add_to_queue(function() {
    application.propose_upgrade();
  });

  gapi.client.setToken({"access_token": getCookie("access_token")});

  gapi.client.load('oauth2', 'v2', function() {
    gapi.client.load('drive', 'v2', function(){
      var request = gapi.client.oauth2.userinfo.get();
      application.controllers.google_oauth.execute_request(request, function(response){self.post_auth(true)})
    })
  })
}

GoogleOAuthController.prototype.authorize_params = function(to_add) {
  var self = this;
  var base = {
    client_id: self.client_id,
    scope: self.scopes.join(" "),
    ux_mode: 'popup',
  };

  if(User.get_session_user_id()){
    base["user_id"] = User.get_session_user_id();
  }

  for (var attrname in to_add) { base[attrname] = to_add[attrname]; }

  return base;
}


GoogleOAuthController.prototype.do_auth = function(user_id){
  var self = this
  var isBack = false;

  $('#auth_modal').modal('show')
  $('#start_g_oauth').click(function(){
    self.auth_popup(user_id)
  })
}

GoogleOAuthController.prototype.auth_popup = function(user_id){
  var self = this
  //Do it without the immediate
  var params = {callback: function(auth_result){self.post_auth(auth_result)}};
  if(user_id) {
    params["hint"] = user_id;
  }
  this.client = google.accounts.oauth2.initTokenClient(self.authorize_params(params))
  this.client.requestAccessToken();
}

GoogleOAuthController.prototype.auth_with_user = function(user_id, callback){
  var self = this;
  this.client = google.accounts.oauth2.initTokenClient(self.authorize_params({hint : user_id, callback: function(auth_result){
    application.controllers.editor.reset_collaboration();
    self.post_auth(auth_result);
    callback();
  }}));
  this.client.requestAccessToken({login_hint:user_id});
}

GoogleOAuthController.prototype.switch_user = function() {
  var self = this;
  var previous_user = self.current_user;
  self.auth_with_user(undefined, function(){
    $('#app_restart_modal').modal('show'); 
    window.location.hash = '#new' ; 
    window.location.reload()
  })
}

GoogleOAuthController.prototype.post_auth = function(auth_result){
  var self = this;
  if (auth_result && !auth_result.error) {
    if(auth_result['access_token']) {
      setCookie('access_token', auth_result['access_token'], 1)
      gapi.client.setToken({"access_token":auth_result['access_token']});
    }
    self.ready()
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

GoogleOAuthController.prototype.execute_request = function(request, callback, options){
  var self = this

  options = options || {};

  request.execute(function(response){
    if(!response.error){
      callback(response)
    }
    else if(response.error.code == 401 || response.error.code == 403){
      self.queue.push(function(){self.execute_request(request, callback)})
      self.authed = false
      if(self.current_user && self.current_user.user_id) {
        self.do_auth(self.current_user.user_id)
      }
      else {
        self.do_auth()
      }
    }
    else if(response.error.code == 409){
      console.log("There's that weird 409 error that just occured. We won't take care of it as it's completely unclear what it means and it works anyway. Thanks Google....")
      callback(response);
    }
    else if(options["errorOnlyUnauth"]) {
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

  this.auth_url = this.client.getAuthenticationUrl(window.location);
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

