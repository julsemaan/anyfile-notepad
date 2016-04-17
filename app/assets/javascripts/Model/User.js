function User(id, options){
  var self = this;
  options["uid"] = id
  Model.call(this, options) 

}

User.prototype = new Model()

User.prototype.init = function(){
}

User.current_user = function(callback){
  var request = gapi.client.oauth2.userinfo.get();
  oauth_controller.execute_request(request, function(response){
    var current_user = new User("current_user", {
      user_id : response.id,
      name : response.name,
      email : response.email,
      picture_url : response.picture ? response.picture : '',
      total_space_used : "N/A GB",
      total_space_available : "N/A GB",
    })
    setCookie("current_user_id", current_user.user_id);
    oauth_controller.current_user = current_user;
    callback(current_user)
  }) 
}
