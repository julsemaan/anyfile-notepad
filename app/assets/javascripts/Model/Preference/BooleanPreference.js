function BooleanPreference(value){
  this.value = value == "true" ? true : false
}

BooleanPreference.prototype.valueOf = function(){
  return this.value
}

BooleanPreference.prototype.toString = function(){
  return this.value ? "true" : "false"
}
