function GoogleOAuthController(options){
  var self = this;
  this.client_id = AFN_VARS['google_client_id'];
  this.drive_app_id = AFN_VARS['drive_app_id'];
  this.scopes = options["scopes"]
  this.authed = false
  this.current_user = undefined
  this.client = undefined;
  this.queue = [];
}

GoogleOAuthController.prototype.init = function(){
  var self = this;
  this.add_to_queue(function(){
    User.current_user(function(user){self.current_user = user});
  });
  this.add_to_queue(function() {
    application.propose_upgrade();
    self.keep_token_alive();
  });
    

  if(window.location.hash.match("^#google_access_token=")){
    self.setToken(window.location.hash.replace("#google_access_token=", ""));
  }

  if(!sessionStorage.access_token) {
    sessionStorage.access_token = getCookie("access_token");
  }
  else {
    setCookie("access_token", sessionStorage.access_token, 1);
  }

  gapi.client.setToken({"access_token": sessionStorage.access_token});

  gapi.client.load('oauth2', 'v2', function() {
    gapi.client.load('drive', 'v2', function(){
      gapi.load('picker', function() {
        var request = gapi.client.oauth2.userinfo.get();
        application.controllers.google_oauth.execute_request(request, function(response){self.ready()})
      })
    })
  })
}

GoogleOAuthController.prototype.do_auth = function(user_id){
  var self = this
  var auth = function() {
    sessionStorage.google_auth_return_to = window.location;
    var url = "/api/oauth2/google/authorize";
    if(user_id) {
      url += "?login_hint="+user_id;
    }
    window.location = url;
  };

  if(!sessionStorage.hasAuthedOnce) {
    $('#auth_modal').modal('show')
    $('#start_g_oauth').click(function() {
      auth();
    });
  }
  else {
    auth();
  }

}

GoogleOAuthController.prototype.auth_with_user = function(user_id, callback){
  var self = this;
  self.do_auth(user_id);
}

GoogleOAuthController.prototype.switch_user = function() {
  var self = this;
  self.do_auth();
}

GoogleOAuthController.prototype.setToken = function(token) {
  setCookie('access_token', token, 1);
  sessionStorage.access_token = token;
  gapi.client.setToken({"access_token":token});
  sessionStorage.hasAuthedOnce = true;
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
  StatIncrement.record("GoogleOAuthController.prototype.show_reauth");
  new Popup({ message : i18n('Failed to communicate with Google servers. Please restart the app.'), callback : function(result) {if(result) application.controllers.editor.restart_app(true)}, confirm_btn : i18n('Restart now')});
}

GoogleOAuthController.prototype.execute_request = function(request, callback, options){
  var self = this

  options = options || {};
  
  // Definitely not the right way to do it but when we obtain a new access token and try to execute the same request again,
  // it doesn't include the token at all.
  // There is no way to copy the request or re-init it...
  // Will this work for good or will these internal variables change name? Time will tell
  // If this doesn't exist, when the token expires, the user will be caught in an endless loop
  var headers = findNestedHashKey(request, 'headers');
  if(headers) {
    headers["Authorization"] = "Bearer "+sessionStorage.access_token;
  }
  else {
    // This will trigger a monit alert by being logged in the syslog of the app server
    $.get("/AFN-ERROR?EXECUTE_REQUEST_WORKAROUND_FAIL");
  }

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
      else if (User.get_session_user_id()) {
        self.do_auth(User.get_session_user_id())
      }
      else {
        self.do_auth()
      }
    }
    else if(response.error.code == 409){
      console.error("There's that weird 409 error that just occured. We won't take care of it as it's completely unclear what it means and it works anyway. Thanks Google....")
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

GoogleOAuthController.prototype.keep_token_alive = function() {
  var self = this;
  var request = gapi.client.oauth2.userinfo.get();
  application.controllers.google_oauth.execute_request(request, function(response){
    console.debug(new Date(), "token alive");
    setTimeout(function() { self.keep_token_alive() }, 60000);
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
  console.error("ERROR in DropboxRequest.prototype.handle_error", error)
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

