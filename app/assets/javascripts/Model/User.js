function User(id, options){
  var self = this;
  options["uid"] = id
  Model.call(this, options) 

}

User.prototype = new Model()

User.prototype.init = function(){
}

User.current_user = function(callback){
  var request = gapi.client.drive.about.get();
  oauth_controller.execute_request(request, function(response){
    callback(new User("current_user", {
      name : response.user.displayName,
      email : response.user.emailAddress,
      picture_url : response.user.picture.url,
      total_space_used : ( response.quotaBytesUsed / 1024 / 1024 / 1024 ).toFixed(2) + " GB",
      total_space_available : ( response.quotaBytesTotal / 1024 / 1024 / 1024 ).toFixed(2) + " GB",
    }))
  }) 
}
