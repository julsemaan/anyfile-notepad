function OAuthController(options){
  var self = this;
  this.client_id = "249464630588-o75jk2pev47r0q08kmo8ebfluid5ednf.apps.googleusercontent.com"
  this.api_key = "AIzaSyATcBRP-XTVBvGSKstwqUg1x23CEufr310"
  this.scopes = options["scopes"]
  this.authed = false
  //this.init()
  this.queue = [];
}

OAuthController.prototype.init = function(){
  var self = this;
  gapi.client.setApiKey(this.api_key)
  setTimeout(function(){self.check_authed()}, 15000)
  this.do_auth();
}

OAuthController.prototype.do_auth = function(){
  var self = this
  gapi.auth.authorize({client_id: this.client_id, scope: this.scopes, immediate : true}, function(auth_result){
    if(auth_result["error"] != "immediate_failed"){
      self.post_auth(auth_result)
    }
    else{
      //Do it without the immediate
      gapi.auth.authorize({client_id: self.client_id, scope: self.scopes}, function(auth_result_without_immediate){self.post_auth(auth_result_without_immediate)})
    }
  
  });

}

OAuthController.prototype.post_auth = function(auth_result){
  var self = this;
  console.log(auth_result)
  setCookie('access_token', auth_result['access_token'], 1)
  if (auth_result && !auth_result.error) {
    gapi.client.load('drive', 'v2', function(){
      self.ready()
    })
    
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
}

OAuthController.prototype.add_to_queue = function(to_do){
  var self = this;
  this.queue.push(to_do)
}

OAuthController.prototype.show_reauth = function(){
  $('#reauthenticate_modal').modal('show')
}

OAuthController.prototype.auth_failed = function(){
  $('#auth_failed_modal').modal('show')
  $('#restart_app').click(function(){
    window.location.reload()
  })
}

OAuthController.prototype.check_authed = function(){
  if(!this.authed){
    this.auth_failed()
  }
}
