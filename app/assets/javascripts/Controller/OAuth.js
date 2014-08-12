function OAuthController(options){
  var self = this;
  this.client_id = "449833954230-k0jhblecv85a48vc4e81pf1pf3sk25fe.apps.googleusercontent.com"
  this.api_key = "AIzaSyDYsvQPvcYLI8RzIW28XSFZHD0HUjDX5YE"
  this.scopes = options["scopes"]
  //this.init()
  this.queue = [];
}

OAuthController.prototype.init = function(){
  var self = this;
  gapi.client.setApiKey(this.api_key)
  gapi.auth.authorize({client_id: this.client_id, scope: this.scopes, immediate: true}, function(auth_result){self.post_auth(auth_result)});
}

OAuthController.prototype.post_auth = function(auth_result){
  var self = this;
  if (auth_result && !auth_result.error) {
    gapi.client.load('drive', 'v2', function(){
      self.ready()
    })
    //cool it worked
  }
  else{
    this.show_reauth();
  }
}

OAuthController.prototype.ready = function(){
  var self = this;
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
