Class("StringPreference", ["Preference"]);

StringPreference.find = Preference.find;

StringPreference.prototype.valueOf = function(){
  return this.value
}
