function Preference(key, value){
  this.key = key;
  this.value = value;
}

Preference.getBackend = function(){
  return JSON.parse(unescape(getCookie("preferences")));
}

Preference.find = function(key, valueType){
  var data = key.split("[")
  if(data.length == 1){
    return new Preference(key, new valueType(Preference.getBackend()[key]))
  }
  // we're dealing with an hash or array access
  else{
    try{
      var array = data[0]
      data = data[1].split("]")
      var array_key = data[0]
      return new Preference(key, new valueType(Preference.getBackend()[array][array_key]))
    } catch(err) {
      return;
    }
  }
}

Preference.prototype.get = function(){
  var self = this;
  return this.value.valueOf()
}

Preference.prototype.set = function(value, locker, fail_action){
  var self = this;
  var locking_key = 'setting_'+value
  this.value = value
  
  locker.set_wait(locking_key, true)
  var url = '/preferences/get_update?'+this.key+'='+String(this.value);
   $.ajax(
    {
      url: url,
      statusCode: {
        403: function(data){
          locker.set_wait(locking_key, false)
          fail_action()
        },
        200: function(data){
          locker.set_wait(locking_key, false)
        }
      }
    }) 
}
