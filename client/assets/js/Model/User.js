function User(id, options){
  var self = this;
  options["uid"] = id
  Model.call(this, options) 

}

User.prototype = new Model()

User.prototype.init = function(){
}

User.prototype.loadSubscription = function() {
  var self = this;
  $.get("/api/billing/subscription/"+this.user_id)
    .done(function(res) {
      self.subscription = res;
    }).fail(function(res) {
      // 404 is acceptable
      if(res.status == 404) {
        return;
      }

      new Popup({ message : i18n('Unable to fetch your current subscription. It is advised to restart the application.'), callback : function(result) {if(result) application.controllers.editor.restart_app()}, confirm : true, confirm_btn : i18n('Restart now'), cancel_btn : i18n('Restart later')});
    });
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
    var previousUser = User.get_session_user_id();

    User.set_session_user_id(current_user.user_id);
    application.controllers.google_oauth.current_user = current_user;
    setCookie("current_google_user_id", current_user.user_id)

    if(previousUser != current_user.user_id) {
      $('#app_restart_modal').modal('show');
      window.location.reload();
    }
    else {
      current_user.loadSubscription();
      callback(current_user);
    }
  }) 
}
