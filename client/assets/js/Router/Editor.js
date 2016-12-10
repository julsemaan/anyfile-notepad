function EditorRouter(controller){
  var self = this
  this.controller = controller
  

  this.load_models(function(){
    if(self.controller.post_app_load) self.controller.post_app_load()
    $(window).bind('hashchange', function() {
      // we don't want to record the access token hash
      if(!window.location.hash.match('^#access_token')){
        setCookie("last_hash_url", window.location.hash, 1);
      }
      self.controller.deactivate_autosave()
      self.route()
    });
    self.route()
  })
}

EditorRouter.prototype.load_models = function(callback){
  var self = this
  for(var model in this.controller.models){
    //this is why programmers hate javascript
    (function(){
      var m2 = model
      if(!self.controller.models[model].loaded){
        self.controller.models[model].load(function(){self.post_model_load(m2, callback)})
      }
    })()
  }
}

EditorRouter.prototype.post_model_load = function(model, callback){
  var self = this
  window[model] = self.controller.models[model]
  if(this.check_models_loaded()){
    callback()
  }
}

EditorRouter.prototype.check_models_loaded = function(){
  var self = this
  for(var model in this.controller.models){
    if(!self.controller.models[model].loaded){
      return false;
    }
  }
  return true;
}

EditorRouter.prototype.parse_hash_url = function(){
  this.hash_url = window.location.hash.substr(1);
  this.hash_paths = this.hash_url.split("/")
}

EditorRouter.prototype.parse_parameters = function() {
      var prmstr = window.location.search.substr(1);
      this.params = prmstr != null && prmstr != "" ? this.params_to_hash(prmstr) : {};
}

EditorRouter.prototype.params_to_hash = function( prmstr ) {
    var params = {};
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}

EditorRouter.prototype.route = function(){
  var self = this;
  var router = new Router();

  router.getHandler = function(name){return function(name){alert(name)}}

  router.map(function(match){

    match("#edit/:id").to("edit");
    match("#new/:folder_id").to("new");
    match("#new").to("new");

    match("#edit/:provider/*id").to("edit");
    match("#new/:provider").to("new");
    match("#new/:provider/*folder_id").to("new");

    match("/").to("redirect_new");
  });

  var transition = router.handleURL(window.location.hash);

  console.log(transition);

  var actions = {
    edit: function(transition){
      self.controller.provider = transition.params.provider || DEFAULT_PROVIDER;
      self.controller.edit(transition.params.id);
    },
    new: function(transition){
      self.controller.provider = transition.params.provider || DEFAULT_PROVIDER;
      self.controller.new(transition.params.folder_id);
    },
    redirect_new: function(transition){
      if(!self.check_for_drive()) {
        window.location.hash = "#new/"+DEFAULT_PROVIDER
      }
    },
    handle_dropbox_token: function(transition){
      console.log("checking token...")
      dropbox_oauth_controller.test(function(){
        window.location.hash = getCookie("last_hash_url") || "#new/Dropbox";
      });
    },
  };

  var action = actions[transition.targetName];
  if(action){
    action(transition);
    return;
  }

  if(window.location.hash.match("^#access_token=")){
    actions.handle_dropbox_token();
  }
  
// actions.redirect_new();
} 

EditorRouter.prototype.check_for_drive = function() {
//  https://anyfile-notepad.semaan.ca/app?state=%7B%22ids%22:%5B%220B-k7e2bQSB5_Mlc4YjNHemNJb28%22%5D,%22action%22:%22open%22,%22userId%22:%22118166999581315270523%22%7D
//  https://devbox.home.semaan.ca/app?state=%7B%22ids%22:%5B%220B-k7e2bQSB5_Mlc4YjNHemNJb28%22%5D,%22action%22:%22open%22,%22userId%22:%22118166999581315270523%22%7D
  var self = this;
  this.parse_hash_url();
  this.parse_parameters();
  // Special handling for Google Drive
  if(this.params['state']){
    state = JSON.parse(decodeURI(this.params['state']))
    console.log(state['userId'], oauth_controller.current_user.user_id)
    if(oauth_controller.current_user.user_id != state['userId']){
      $('#user_auth_modal').modal('show');
      $('#switch_user').click(function() {
        oauth_controller.auth_with_user(state['userId'], function(){
            self.handle_drive_params(state);
            window.location.reload();
        });
        $('#user_auth_modal').modal('hide');
      });
    }
    else {
      self.handle_drive_params(state);
    }
    return true;
  }
  return false
}

EditorRouter.prototype.handle_drive_params = function(state) {
  var self = this;
  if(state['action'] == 'open'){
    window.history.pushState('Anyfile Notepad', 'Anyfile Notepad', "app");
    window.location.hash = "#edit/GoogleDrive/"+state['ids'][0]
    return true
  }
  else if(state['action'] == 'create'){
    window.history.pushState('Anyfile Notepad', 'Anyfile Notepad', "app");
    window.location.hash = "#new/GoogleDrive/"+state['folderId']
    return true
  }
}
