function OAuthController(options){
  var self = this;
  this.client_id = "249464630588-ombbls22arnr75jdl4uprsof9t9rrp42.apps.googleusercontent.com"
  this.api_key = "AIzaSyBxYkmTLod4Js9yR9hcD9puRUHRl2gQDXU"
  this.scopes = options["scopes"]
  this.authed = false
  this.current_user = undefined
  //this.init()
  this.queue = [];
}

OAuthController.prototype.init = function(){
  var self = this;
  gapi.client.setApiKey(this.api_key)
  setTimeout(function(){self.check_authed()}, 15000)
  this.add_to_queue(function(){
    User.current_user(function(user){self.current_user = user})
  })
  this.do_auth();
}

OAuthController.prototype.do_auth = function(){
  var self = this
  gapi.auth.authorize({client_id: this.client_id, scope: this.scopes, immediate : true}, function(auth_result){
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

OAuthController.prototype.auth_popup = function(){
  var self = this
  //Do it without the immediate
  gapi.auth.authorize({client_id: self.client_id, scope: self.scopes}, function(auth_result_without_immediate){self.post_auth(auth_result_without_immediate)})
}

OAuthController.prototype.post_auth = function(auth_result){
  var self = this;
  if (auth_result && !auth_result.error) {
    gapi.load('auth:client,drive-realtime,drive-share', function(){
      gapi.client.load('drive', 'v2', function(){
        setCookie('access_token', auth_result['access_token'], 1)
        self.ready()
      })
    });
    
    $('#auth_modal').modal('hide')
    //cool it worked
  }
  else{
    this.auth_failed();
  }
}

OAuthController.prototype.ready = function(){
  var self = this;
  this.authed = true
  for(var i=0; i < this.queue.length; i++){
    this.queue[i]()
  } 
  this.queue = []
}

OAuthController.prototype.add_to_queue = function(to_do){
  var self = this;
  this.queue.push(to_do)
}

OAuthController.prototype.show_reauth = function(){
  $('#reauthenticate_modal').modal('show')
}

OAuthController.prototype.auth_failed = function(){
  //$('#auth_failed_modal').modal('show')

}

OAuthController.prototype.check_authed = function(){
  if(!this.authed){
    this.auth_failed()
  }
}

OAuthController.prototype.execute_request = function(request, callback){
  var self = this
  request.execute(function(response){
    if(!response.error){
      callback(response)
    }
    else if(response.error.code == 401){
      self.queue.push(function(){self.execute_request(request, callback)})
      self.authed = false
      self.do_auth()
    }
    else{
      $('#error_modal .add_message').html("We got this message from Google : "+ response.error.message)
      $('#error_modal').modal('show')
      callback(response)
    }
  });
}
