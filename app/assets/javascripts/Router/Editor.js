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
    if(!self.controller.models[model].loaded){
      self.controller.models[model].load(function(){
        window[model] = self.controller.models[model]
        self.load_models(callback)
      })
      return
    }
  }
  callback()
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
  this.parse_parameters()
  this.parse_hash_url()
  if(this.params['state']){
    state = JSON.parse(decodeURI(this.params['state']))
    console.log(state)
    if(state['action'] == 'open'){
      window.history.pushState('Anyfile Notepad', 'Anyfile Notepad', "app#edit/"+state['ids'][0]);
      this.controller.edit(state['ids'][0])
      return
    }
    else if(state['action'] == 'create'){
      window.history.pushState('Anyfile Notepad', 'Anyfile Notepad', "app#new/"+state['folderId']);
      this.controller.new(state['folderId'])
      return
    }
  }
  try{
    if(this.hash_paths[0] == "edit"){
      if(this.hash_paths[1]){
        this.controller.edit(this.hash_paths[1])
        return
      }
    } 
  } catch(e){}
  
  if(this.hash_paths[0] == "new"){
    try{
      this.controller.new(this.hash_paths[1])
      return
    }catch(e){}
    this.controller.new()
    return
  }
  window.location = "#new"
} 
