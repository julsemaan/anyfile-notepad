function Model(ledata){
  if(!ledata){
    return
  }
  if(!ledata["uid"]){
    this.uid = this.constructor.name
  }
  else{
    this.uid = ledata["uid"] 
  }
  this.install_binder()

  for (var key in ledata){
    this.set(key, ledata[key]) 
  }
  this.post_init()
}

Model.prototype.init = function(args){
  Model.call(this,args);
}

Model.prototype.post_init = function(){}

Model.prototype.get_backend = function(){
  console.log("get_backend not implemented. are you stupid ?")
}

Model.prototype.install_binder = function(){
  var self = this
  var binder = new DataBinder( this.uid )

  this._binder = binder

  // Subscribe to the PubSub
  binder.on( this.uid + ":change", function( evt, attr_name, new_val, initiator ) {
    if ( initiator !== self ) {
      self.set( attr_name, new_val );
    }
  });
}

// The attribute setter publish changes using the DataBinder PubSub
Model.prototype.set = function( attr_name, val ) {
  this[ attr_name ] = val;
  this._binder.trigger( this.uid + ":change", [ attr_name, val, this ] );
}

Model.prototype.get = function( attr_name ) {
  return this[ attr_name ];
}

Class("RestAdapter", ["Model"]);

RestAdapter.prototype.post_init = function(){
  this.set("loaded", false) 

  if(!this.base_url) this.set("base_url", "") 
  if(!this.suffix) this.set("suffix", "") 

  if (!this.model) throw "No model"
  for (var key in this.model.rest_attributes()){
    this.set(key, this.model.rest_attributes()[key])
  }

  if (!this.model_name) throw "No model name" 

  if(!this.url_name) this.set("url_name", this.model_name)

  this.set("_index_url", this.base_url+"/"+this.url_name+this.suffix)

  if(this.id){
    this.set("_object_url", this.base_url+"/"+this.url_name+"/"+this.id+this.suffix)
  }
}

RestAdapter.prototype.get_backend = function(callback){
  var self = this
  callback = callback || function(){}
  if(!this.loaded){
    this.load(callback)
  }
  else{
    callback()
  }
}

RestAdapter.prototype.load = function(callback){
  var self = this
  callback = callback || function(){}
   $.ajax({
    url:this._index_url,
    success:function(data){
      self.set("data", data)
      self.set("loaded", true)
      callback()
    }
  })  
}

RestAdapter.prototype.load_find = function(what, callback){
  var self = this
  this.get_backend(function(){
    callback(self.find(what))
  })
}

RestAdapter.prototype.find = function(what){
  var self = this
  var key_to_search = what["key"] || "id"
  var val_to_search = what["value"] || "-1" 

  if(!this.loaded){
    throw "Trying to access an unloaded object"
  }
  else{
    for( var i=0; i<self.data.length; i++){
      var object = self.data[i]
      if(object[key_to_search] === val_to_search){
        eval("object = new "+self.model_name+"(object)")
        return object
      }
    }   
  }
}

RestAdapter.prototype.all = function(){
  var self = this
  if(!this.loaded){
    throw "Tryng to access an unloaded object"
  }
  else{
    var objects = []
    for( var i=0; i<self.data.length; i++){
      var object = self.data[i]
      eval("object = new "+self.model_name+"(object)")
      objects.push(object)
    } 
    return objects
  }
}

function Class(name, inherits) {
  var inherits_str = "";
  var first_inherit;
  if(inherits){
    first_inherit = inherits[0];
  }
  else{
    first_inherit = "Object";
  }
  for(var i in inherits){
    inherits_str += inherits[i] + ",";
  }
  inherits_str += "Model";
  var creator = [
    "window."+name+" = function "+name+"(args){",
    "this.init(args);",
    "}",
    "window."+name+".super_class = "+first_inherit+";",
    "if(!window.classes) window.classes = {};",
    "window.classes[window."+name+"] = '"+name+"';",
    "Inherit("+name+", "+inherits_str+");",
  ].join("\n");
  eval(creator);
}

function Inherit() {
    var c = [].shift.call(arguments),
        len = arguments.length
    while(len--) {
        $.extend(c.prototype, new arguments[len]());
    }
}
