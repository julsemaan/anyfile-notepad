Class("IntPreference", ["Preference"]);

IntPreference.find = Preference.find;

IntPreference.prototype.valueOf = function(){
  return parseInt(this.value)
}
