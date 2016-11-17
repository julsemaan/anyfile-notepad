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
  return new this({
    key: key, 
    value: Preference.getBackend()[key],
  })
}

Preference.prototype.is_empty = function(){
  return (!this.value)
}

Preference.prototype.getValue = function(){
  var self = this;
  return this.valueOf()
}

Preference.prototype.refreshAndSet = function(value, locker, fail_action) {
  var self = this;
  return new RSVP.Promise( function(r, f) {
    user_preferences.refresh(function(){
      r();
      self.setValue(value, locker, fail_action);
    });
  });
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

Preference.prototype.toString = function(){
  return this.value.toString();
}
