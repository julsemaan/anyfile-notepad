Class("Preference", ["Model"]);

Preference.prototype.init = function(args){
  Model.call(this, args);
  if(args){
    this.init_child(args);
  }
}

Preference.prototype.init_child = function(args){}

Preference.getBackend = function(){
  return user_preferences.get_hash()
}

Preference.find = function(key){
  var data = key.split("[")
  if(data.length == 1){
    return new this({
      key: key, 
      value: Preference.getBackend()[key],
    })
  }
  // we're dealing with an hash or array access
  else{
    try{
      var array = data[0]
      data = data[1].split("]")
      var array_key = data[0]
      return new this({ 
        key: key, 
        value: Preference.getBackend()[array][array_key] 
      })
    } catch(err) {
      return;
    }
  }
}

Preference.prototype.is_empty = function(){
  return (!this.value)
}

Preference.prototype.getValue = function(){
  var self = this;
  return this.valueOf()
}

Preference.prototype.setValue = function(value, locker, fail_action){
  var self = this;
  var locking_key = 'setting_'+value
  this.set("value", value)
  
  locker.set_wait(locking_key, true)

  var prefs = Preference.getBackend()
  prefs[this.key] = this.toString()
  user_preferences.set_hash(prefs)
  user_preferences.commit(function(){
    locker.set_wait(locking_key, false)
  })
}
