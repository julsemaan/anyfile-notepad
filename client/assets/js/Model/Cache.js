function Cache(ledata){
  Model.call(this, ledata)
}

Cache.prototype = new Model()

Cache.prototype.init = function(){
  var self = this;

  if(!this.namespace) throw "No namespace specified for cache. That fucks it up."

  this.get_data()
 
}

Cache.prototype.get_data = function(){
  if(typeof(Storage)!=="undefined"){
    var raw_data = localStorage.getItem(this.namespace)
    this.set('data', JSON.parse(raw_data))
    if(!this.data){
      this.set('data', {})
    }
    return true;
  }
  else{
    new Popup({ message : "localStorage is not supported in this browser. Cache will not work which slows down the app considerably." });
    return false;
  }
}

Cache.prototype.set_data = function(){
  if(typeof(Storage)!=="undefined"){
    localStorage.setItem(this.namespace, JSON.stringify(this.data))
    return true;
  }
  else{
    new Popup({ message : "localStorage is not supported in this browser. Cache will not work which slows down the app considerably." });
    return false;
  }
}

Cache.prototype.cache = function(key, value){
  this.data[key] = value
  this.set_data()  
}

Cache.prototype.get_cache = function(key){
  return this.data[key]
}

