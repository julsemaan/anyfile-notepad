Class("BooleanPreference", ["Preference"]);

BooleanPreference.find = Preference.find;

BooleanPreference.prototype.valueOf = function(){
  return this.value
}

BooleanPreference.prototype.toString = function(){
  return this.value ? "true" : "false"
}
