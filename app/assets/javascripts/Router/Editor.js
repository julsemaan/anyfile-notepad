function EditorRouter(controller){
  var self = this
  this.controller = controller
  

  this.load_models(function(){
    if(self.controller.post_app_load) self.controller.post_app_load()
    $(window).bind('hashchange', function() {
      self.controller.deactivate_auto_save()
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
  var router = new Router.default();

  router.getHandler = function(name){return function(name){alert(name)}}

  router.map(function(match){
    match("#edit/:provider/:id").to("edit");
    match("#new/:provider").to("new");
    match("#new/:provider/:folder_id").to("new");

    match("#edit/:id").to("edit");
    match("#new/:folder_id").to("new");
    match("#new").to("new");
  });

  var transition = router.handleURL(window.location.hash);

  console.log(transition);

  var actions = {
    edit: function(transition){
      self.controller.provider = transition.params.edit.provider || DEFAULT_PROVIDER;
      self.controller.edit(transition.params.edit.id);
    },
    new: function(transition){
      self.controller.provider = transition.params.edit.provider || DEFAULT_PROVIDER;
      self.controller.new(transition.params.new.folder_id);
    },
  };

  var action = actions[transition.targetName];
  if(action){
    action(transition);
    return;
  }
  
  // Special handling for Google Drive
  if(this.params['state']){
    state = JSON.parse(decodeURI(this.params['state']))
    if(state['action'] == 'open'){
      window.history.pushState('Anyfile Notepad', 'Anyfile Notepad', "app#edit/GoogleDrive/"+state['ids'][0]);
      this.controller.edit(state['ids'][0])
      return
    }
    else if(state['action'] == 'create'){
      window.history.pushState('Anyfile Notepad', 'Anyfile Notepad', "app#new/GoogleDrive/"+state['folderId']);
      this.controller.new(state['folderId'])
      return
    }
  }
} 
