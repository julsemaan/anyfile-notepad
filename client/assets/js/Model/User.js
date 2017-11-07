function User(id, options){
  var self = this;
  options["uid"] = id
  Model.call(this, options) 

}

User.prototype = new Model()

User.prototype.init = function(){
}

User.set_session_user_id = function(user_id) {
  if(typeof(Storage) !== "undefined") {
    sessionStorage.current_user_id = user_id;
  } else {
    new Popup({ message : i18n("Browser storage is non-existent. The app cannot work without it. Please use another browser or update your current one.") });
  }
}

User.get_session_user_id = function() {
  if(typeof(Storage) !== "undefined") {
    return sessionStorage.current_user_id;
  } else {
    new Popup({ message : i18n("Browser storage is non-existent. The app cannot work without it. Please use another browser or update your current one.") });
  }
}

User.current_user = function(callback){
  var request = gapi.client.oauth2.userinfo.get();
  application.controllers.google_oauth.execute_request(request, function(response){
    var current_user = new User("current_user", {
      user_id : response.id,
      name : response.name,
      email : response.email,
      picture_url : response.picture ? response.picture : '',
      total_space_used : "N/A GB",
      total_space_available : "N/A GB",
    })
    User.set_session_user_id(current_user.user_id);
    application.controllers.google_oauth.current_user = current_user;

    var previousUser = getCookie("current_google_user_id")
    setCookie("current_google_user_id", current_user.user_id)

    if(previousUser != current_user.user_id) {
      $('#app_restart_modal').modal('show');
      window.location.reload();
    }
    else {
      callback(current_user);
    }
  }) 
}
